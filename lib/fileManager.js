var fs = require('fs');
var AWS = require('aws-sdk');
var async = require('async');
var mime = require('mime');
var path = require('path');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// TODO: Separate middleware from other logic.
// TODO: Is this needed?
module.exports = function (app) {

    // Testing
    var resourcesDir = '~';

    // Create folders if they don't exist.
    if (!(fs.existsSync(resourcesDir))) { fs.mkdirSync(resourcesDir); }
    if (!(fs.existsSync(resourcesDir + '/sound'))) { fs.mkdirSync(resourcesDir + '/sound'); }
    if (!(fs.existsSync(resourcesDir + '/image'))) { fs.mkdirSync(resourcesDir + '/image'); }

    var amazonBaseAddress = "https://storypalette.fra1.digitaloceanspaces.com/sound%2F";

    var middleware = {

        // GET resized image: /image/64x64/myimage.jpg
        getImage: function (req, res) {

            // get image dimensions
            var params = req.params[0].split('/');
            var dimensions = params[0].split('x');
            var url;
            // console.log(params);
            if (dimensions[1]) {
                url = 'http://storypalettese.imgix.net/' + params[1] + "?fit=clip&h=" + dimensions[0] + "&w=" + dimensions[1];
            } else {
                url = 'http://storypalettese.imgix.net/' + params[0];
            }

            console.log('GET image ' + url);

            res.redirect(url);
        },
        // GET sound /sound/mysound.ogg
        // params = {id: 12345, ext: 'mp3'}
        getSound: function (req, res) {
            var url = amazonBaseAddress + req.params.id + '.' + req.params.ext;
            res.redirect(url);
        },
        // Handle file uploads.
        postFile: function (req, res) {
            // adapted from https://devcenter.heroku.com/articles/s3-upload-node
            console.log('postfile');
            if (req.xhr) {
                var basename = require('path').basename;
                var fName = basename(req.header('x-file-name'));

                var ext2type = {
                    aif: 'sound',
                    aiff: 'sound',
                    wav: 'sound',
                    mp3: 'sound',
                    ogg: 'sound',
                    jpg: 'image',
                    gif: 'image',
                    jpeg: 'image',
                    png: 'image'
                };

                var extension = fName.substring(fName.lastIndexOf('.') + 1);
                var fileId = fName.substr(0, fName.indexOf("."));
                var localPath = resourcesDir + '/' + ext2type[extension] + '/' + fName;
                
                var buf = new Buffer(0);

                var s3Path = 'image/' + fName;
                if (ext2type[extension] == 'sound') {
                    s3Path = 'sound/' + fName;
                }

                // all sounds are uploaded to AWS S3
                async.waterfall([

                  // upload temporarily to web server
                  function (callback) {
                      try {
                          console.log('writing to buffer');
                          
                          req.on('data', function (data) {
                              buf = Buffer.concat([buf, data]);
                          });
                          req.on('end', function (data) {
                              callback();
                          });
                      }
                      catch (err) {
                          console.log("unable to write to buffer");
                          console.log(err.message);
                          return;
                      }
                  },
                  // upload to amazon
                  function (callback) {
                      var spacesEndpoint = new AWS.Endpoint('fra1.digitaloceanspaces.com');
                      var s3obj = new AWS.S3({
                          endpoint: spacesEndpoint,
                          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                          params: {
                              Bucket: 'storypalette',
                              Key: s3Path
                          }
                      });

                      try {
                          console.log('uploading to s3');
                          s3obj.upload({ Body: buf }).
                              on('httpUploadProgress', function (progress) {
                                  console.log(progress.loaded + " of " + progress.total + " bytes");
                              }).
                              send(function (err, data) {
                                  res.end('finished');
                                  console.log(err, data);
                              });
                      }
                      catch (err) {
                          console.log("unable to transfer file to amazon s3");
                          console.log(err.message);
                      }

                      callback();
                  }
                ], function (err) {
                    if (err) {
                        res.status(500).send('upload failure');
                    }
                });
            }
        }
    }; // middleware

    return middleware;
};
