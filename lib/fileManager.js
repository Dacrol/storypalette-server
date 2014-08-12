var fs = require('fs');

// TODO: Separate middleware from other logic.
module.exports = function(app, config) {

  function utilExist(variable){
    return (!(typeof variable === 'undefined' || variable === null || variable === ""));
  }

  if(!(fs.existsSync(config.server.cache)))
      fs.mkdirSync(config.server.cache);
  if(!(fs.existsSync(config.server.cache+'/image')))
      fs.mkdirSync(config.server.cache+'/image');
  if(!(fs.existsSync(config.server.cache+'/sound')))
      fs.mkdirSync(config.server.cache+'/sound');
  if(!(fs.existsSync(config.server.resources)))
      fs.mkdirSync(config.server.resources);
  if(!(fs.existsSync(config.server.resources+'/image')))
      fs.mkdirSync(config.server.resources+'/image');
  if(!(fs.existsSync(config.server.resources+'/sound')))
      fs.mkdirSync(config.server.resources+'/sound');

  function resizeIm(){
    var im = require('im');
    if (!im.image) return false;
    return function(sizeString, path, res){
      if(!(fs.existsSync(config.server.cache  + '/image/' + sizeString)))
          fs.mkdirSync(config.server.cache  + '/image/' + sizeString);
      var size = sizeString.split('x');
      var gi = new im.image();
      gi.read(config.server.resources + '/image/' + path);
      var newHeight = gi.height / gi.width * size[0];
      var scaledImage;
      if (newHeight < size[1]) {
        scaledImage = gi.scale(size[0], newHeight);
      } else {
        scaledImage = gi.scale(gi.width / gi.height * size[1], size[1]);
      }
      scaledImage.write(config.server.cache + '/image/' + sizeString + '/' + path);
      if (!pipeFile(config.server.cache + '/image/' + sizeString + '/' + path,res)) {
        res.end('Error');
      }
    };
  }

  function resizeGm(){
    var GraphicsMagick = require('gm');

    return function(sizeString,path,res){
      if(!(fs.existsSync(config.server.cache + '/image/' + sizeString))) {
        fs.mkdirSync(config.server.cache + '/image/' + sizeString);
      }

      var size = sizeString.split('x');
      GraphicsMagick(config.server.resources + '/image/' + path)
        .resize(size[0], size[1])
        .write(config.server.cache + '/image/' + sizeString + '/' + path, function (err) {
          if (!err) {
            if (!pipeFile(config.server.cache + '/image/' + sizeString + '/' + path,res)) {
              res.end('Error');
            }
          } else {
            res.end('Error');
          }
        });
    };
  }

  var resizeImage = false;
  try {
    require.resolve('imops');
    resizeImage = resizeIm();
    console.log('using imops!');
    if (!resizeImage) {
      resizeImage = resizeGm();
    }
  }
  catch (e) {
    try {
      require.resolve('gm');
      console.log('using gm!');
      resizeImage = resizeGm();
    }
    catch (e) {
      console.error('fileManager: No image resizing module found (neither im nor gm)');
    }
  }

  function pipeFile(path, res, req){
    console.log('pipeFile', path);
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

  app.get('/image/*', function(req, res) {
    console.log('getting image', req.params);
    if (req.params[0].indexOf('{') != -1){
      res.end('no shit');
      return;
    }

    var params = req.params[0].split('/');
    console.log('splitting params', params);
    if (!utilExist(params[1])){
      if (!pipeFile(config.server.resources + '/image/' + params[0],res,req)) {
        res.end('');
      }
      return;
    }

    if (pipeFile(config.server.cache + '/image/' + params[0] + '/' + params[1], res, req)) {
      return;
    }

    console.log('about to resize...', resizeImage);
    resizeImage(params[0], params[1], res);
    return;
  });

  app.get('/sound/*', function(req, res) {
    console.log('get sound', req.params);
    if (req.params[0].indexOf('{')!=-1){
      res.end('');
      return;
    }

    var params = req.params[0].split('/');
    if (!utilExist(params[1])) {
      if (!pipeFile(config.server.resources + '/sound/' + params[0],res,req)) {
        res.end();
      }
      return;
    }
    if (pipeFile(config.server.cache + '/sound/' + params[1], res, req)) {
      return;
    } 
    res.end('error');
    return;
  });

  app.post('/file', function(req, res) {
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
      var ws = fs.createWriteStream(config.server.resources + '/' + ext2type[extension]+'/' + fName);
      req.on('data', function(data) {ws.write(data);});
      req.on('end', function(data) {ws.end();res.end(''); });
    }
  });
};
