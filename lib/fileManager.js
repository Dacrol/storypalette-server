var fs = require('fs');
var AWS = require('aws-sdk');

var ogger = require('./ogger');
var path = require('path');
var cloudinary = require('cloudinary');

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
  
  // Returns false if file doesn't exist
  function pipeFile(path, res, req){
    if (!fs.existsSync(path)) {
      // removed because too verbose console.log('file', path, 'does not exist');
      return false;
    }

    var type = require('mime').lookup(path);
     fs.stat(path, function (err, stat) {
      var etag = stat.size + '--' + Date.parse(stat.mtime);
      if(req && req.headers['if-none-match'] === etag) {
        res.statusCode = 304;
        res.end();
        return true;
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
  
  var cloudinaryBaseAddress = "http://res.cloudinary.com/storypalette/image/upload/";
    
  var middleware = {
    
    // GET resized image: /image/64x64/myimage.jpg
    getImage: function(req, res) {

      // get image dimensions  
      var params = req.params[0].split('/');
      var dimensions = params[0].split('x');
      var url;
      
      if (dimensions[1])
        url = cloudinaryBaseAddress + "h_" + dimensions[0] + ",w_" + dimensions[1] + "/" + params[1];      
      else
        url = cloudinaryBaseAddress + params[0]; 
        
      console.log("GET " + url);
      
      res.redirect(url);
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
        //console.log('exisiting resource');
        path = resPath; 
      } else if (fs.existsSync(cachePath)){
        //console.log('exisiting cached resource');
        // Not in resources dir, but it has been converted/cached earlier.
        path = cachePath;
      } else {

        // Nope, it doesnt' exist. How about with another extension?
        // TODO: Look through all supported extensions
        resPath = resourcesDir + '/sound/' + id + '.mp3'; 
        if (fs.existsSync(resPath)) {

          // File exists but needs to be converted.
          converting = true;
          console.log('Converting to', id + '.' + ext + '...');

          // Convert to ogg
          ogger.convert(resPath, cachePath, function() {
              console.log('Finished processing audio!');
              if (!pipeFile(path, res, req)) {
                res.end('error getting sound');
              }
              return;
          });

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
      console.log('postfile');
      if(req.xhr) {
        var basename = require('path').basename,
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
        var fullName = resourcesDir + '/' + ext2type[extension]+'/' + fName;
        var stream;
        
        if (ext2type[extension] == "image")
        {
          var imageId = fName.substr(0, fName.indexOf(".")); 
          
          console.log("uploaded to cloudinary, " + fName);
          stream = cloudinary.uploader.upload_stream(function(result) { console.log(result); }, 
          { public_id: imageId, eager: { width: 220, height: 220 } });
          req.on('data', function(data) {stream.write(data);});
          req.on('end', function(data) {stream.end(); res.end(''); });
        }
        else
        {
          /*console.log('write', fullName);
          var ws = fs.createWriteStream(fullName);
          req.on('data', function(data) {ws.write(data);});
          req.on('end', function(data) {ws.end(); res.end('');});
          */
          var s3 = new AWS.S3();
          var params = {Bucket: 'storypalette', Key: fName};
          stream = require('fs').createWriteStream(fName);

          s3.getObject(params).
          req.on('data', function(data) { stream.write(data); }).
          req.on('end', function() { stream.end(); }).
          send();
        }
      }
    }
  }; // middleware

  return middleware;
};
