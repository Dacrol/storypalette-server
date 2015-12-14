var fs = require('fs');
var AWS = require('aws-sdk');
var async = require('async');
var mime = require('mime');
var ogger = require('./ogger');
var path = require('path');
var cloudinary = require('cloudinary');


AWS.config.update({accessKeyId: 'AKIAJ3ML5CCMD6V3D4IA', secretAccessKey: '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'});

// TODO: Separate middleware from other logic.
module.exports = function(app, config) {

  var resourcesDir = config.server.resources;

  // Create folders if they don't exist.
  if(!(fs.existsSync(resourcesDir)))            {fs.mkdirSync(resourcesDir);}
  if(!(fs.existsSync(resourcesDir +'/sound')))  {fs.mkdirSync(resourcesDir + '/sound');}
    
  var cloudinaryBaseAddress = "http://res.cloudinary.com/storypalette/image/upload/";
  var amazonBaseAddress = "https://storypalette.s3.eu-central-1.amazonaws.com/sound%2F";
  
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
        
      console.log('GET ' + url);
      
      res.redirect(url);
    },
    // GET sound /sound/mysound.ogg
    // params = {id: 12345, ext: 'mp3'}
    getSound: function(req, res) 
    {   
      var url = amazonBaseAddress + req.params.id + '.ogg';
      console.log('GET ' + url);             
      res.redirect(url);     
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
        var fileId = fName.substr(0, fName.indexOf(".")); 
        var localPath = resourcesDir + '/' + ext2type[extension]+'/' + fName;
        var localPathOgg = resourcesDir + '/' + ext2type[extension]+'/' + fileId + '.ogg';
        var s3Path = 'sound/' + fileId + '.ogg';
        var stream;
        
        if (ext2type[extension] == "image")
        {
          // all images are uploaded to cloudinary          
          console.log("uploaded to cloudinary, " + fName);
          stream = cloudinary.uploader.upload_stream(function(result) { console.log(result); }, 
          { public_id: fileId, eager: { width: 220, height: 220 } });
          req.on('data', function(data) {stream.write(data);});
          req.on('end', function(data) {stream.end(); res.end(''); });
        }
        else
        {              
          // all sounds are uploaded to AWS S3
          async.waterfall([
            
            // upload temporarily to web server 
            function(callback) {
              var ws = fs.createWriteStream(localPath);
              req.on('data', function(data) {ws.write(data);});
              req.on('end', function(data) {ws.end(); 
                callback();
              }); 
            },
            // convert to ogg format
            function(callback) {
              ogger.convert(localPath, localPathOgg, function() {
                callback();
              });
            },
            // upload to amazon
            function(callback)
            {
              var body = fs.createReadStream(localPathOgg);
              var s3obj = new AWS.S3({signatureVersion: 'v4', region: 'eu-central-1', params: {Bucket: 'storypalette', Key: s3Path}});
              s3obj.upload({Body: body}).
              on('httpUploadProgress', function (progress) {
                console.log(progress.loaded + " of " + progress.total + " bytes");
              
                if (progress.loaded == progress.total)
                {
                  res.end('finished');
                }
              }).
              send(function(err, data) { console.log(err, data); }); 
              
              callback();
            },
            // remove temp file from web server
            function(callback) {
              fs.unlink(localPath);
              fs.unlink(localPathOgg);
              callback();               
            }           
        ], function(err) {
            if (err) {
              res.status(500).send('upload failure');
            }
        });    
        }
      }
    }
  }; // middleware

  return middleware;
};
