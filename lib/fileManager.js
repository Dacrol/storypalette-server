var fs = require('fs');
var imops = require('imops');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');

// TODO: Separate middleware from other logic.
module.exports = function(app, config) {

  var cacheDir = config.server.cache;
  var resourcesDir = config.server.resources;

  function utilExist(variable) {
    return (!(typeof variable === 'undefined' || variable === null || variable === ""));
  }

  // Create folders if they don't exist.
  if(!(fs.existsSync(cacheDir)))                {fs.mkdirSync(cacheDir);}
  if(!(fs.existsSync(cacheDir + '/image')))     {fs.mkdirSync(cacheDir + '/image');}
  if(!(fs.existsSync(cacheDir + '/sound')))     {fs.mkdirSync(cacheDir + '/sound');}
  if(!(fs.existsSync(resourcesDir)))            {fs.mkdirSync(resourcesDir);}
  if(!(fs.existsSync(resourcesDir + '/image'))) {fs.mkdirSync(resourcesDir + '/image');}
  if(!(fs.existsSync(resourcesDir +'/sound')))  {fs.mkdirSync(resourcesDir + '/sound');}

  // Resize image using imops.
  function resizeImage(sizeString, path, res){
    if(!(fs.existsSync(cacheDir  + '/image/' + sizeString))) {
      fs.mkdirSync(cacheDir  + '/image/' + sizeString);
    }
    var size = sizeString.split('x');
    var gi = new imops.image();
    gi.read(resourcesDir + '/image/' + path);

    var newHeight = gi.height / gi.width * size[0];
    var scaledImage;
    if (newHeight < size[1]) {
      scaledImage = gi.scale(size[0], newHeight);
    } else {
      scaledImage = gi.scale(gi.width / gi.height * size[1], size[1]);
    }

    scaledImage.write(cacheDir + '/image/' + sizeString + '/' + path);
    if (!pipeFile(cacheDir + '/image/' + sizeString + '/' + path,res)) {
      res.end('Error');
    }
  }

  // Returns false if file doesn't exist
  function pipeFile(path, res, req){
    if (!fs.existsSync(path)) {
      console.log('file', path, 'does not exist');
      return false;
    }

    var type = require('mime').lookup(path);
    fs.stat(path, function (err, stat) {
      etag = stat.size + '--' + Date.parse(stat.mtime);
      if(req && req.headers['if-none-match'] === etag) {
        res.statusCode = 304;
        res.end();
        return;
      }
      res.setHeader('Last-Modified', stat.mtime);
      res.setHeader('Content-Type', type);
      res.setHeader('ETag', etag);
      res.statusCode = 200;
      var fileStream = fs.createReadStream(path);
      fileStream.on('error',function(err) {console.log(err.errno);});
      fileStream.on('data', function (data) {res.write(data);});
      fileStream.on('end', function() {res.end();});
    });
    return true;
  }
    

  var middleware = {

    // GET resized image: /image/64x64/myimage.jpg
    getImage: function(req, res) {
      if (req.params[0].indexOf('{') != -1){
        res.end('no shit');
        return;
      }

      var params = req.params[0].split('/');
      if (!utilExist(params[1])){
        if (!pipeFile(resourcesDir + '/image/' + params[0], res, req)) {
          res.end('');
        }
        return;
      }

      if (pipeFile(cacheDir + '/image/' + params[0] + '/' + params[1], res, req)) {
        return;
      }

      resizeImage(params[0], params[1], res);
      return;
    },
  
    // GET sound /sound/mysound.ogg
    // params = {id: 12345, ext: 'mp3'}
    getSound: function(req, res) {
      if (!utilExist(req.params.id) || !utilExist(req.params.ext)) {
        res.end('Missing sound id or extension');
        return;
      }

      //var supportedExtensions = ['mp3', 'ogg'];
      //var requireOgg = true;
      var id = req.params.id;
      var ext = req.params.ext;
      var resPath = resourcesDir + '/sound/' + id + '.' + ext;
      var cachePath = cacheDir + '/sound/' + id + '.' + ext;
      var path; 
      var converting = false;

      if (fs.existsSync(resPath)) {
        // File is in resources dir.
        console.log('exisiting resource');
        path = resPath; 
      } else if (fs.existsSync(cachePath)){
        console.log('exisiting cached resource');
        // Not in resources dir, but it has been converted/cached earlier.
        path = cachePath;
      } else {
        // Nope, it doesnt' exist. How about with another extension?
        resPath = resourcesDir + '/sound/' + id + '.mp3'; // TODO: Look through all supported extensions
        if (fs.existsSync(resPath)) {

          // File exists but needs to be converted.
          converting = true;
          console.log('Converting to ', id + '.' + ext);
          // TODO: Hardcoded to convert to ogg - make presets for different conversions.
          ffmpeg(resPath)
            .on('end', function() {
              console.log('Finished processing');
              if (!pipeFile(path, res, req)) {
                res.end('error getting sound');
              }
              return;
            })
            .on('error', function(err) {
              console.log('ffmpeg error: ' + err.message);
              return;
            })
            .audioCodec('libvorbis')
            .save(cachePath);
          path = cachePath;
        }
      }

      if (!converting) {
        if (!pipeFile(path, res, req)) {
          res.end('error getting sound');
        }
        return;
      }
    },

    // Handle file uploads.
    postFile: function(req, res) {
      if(req.xhr) {
        var fSize = req.header('x-file-size'),
            fType = req.header('x-file-type'),
            basename = require('path').basename,
            fName = basename(req.header('x-file-name'));

        var ext2type = {
          mp3: 'sound',
          ogg: 'sound',
          jpg: 'image',
          gif: 'image',
          jpeg: 'image',
          png: 'image'
        };

        var extension = fName.substring(fName.lastIndexOf('.')+1);
        var ws = fs.createWriteStream(resourcesDir + '/' + ext2type[extension]+'/' + fName);
        req.on('data', function(data) {ws.write(data);});
        req.on('end', function(data) {ws.end(); res.end(''); });
      }
    }
  }; // middleware

  return middleware;
};
