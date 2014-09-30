// Make oggs using ffmpeg.
// Converts mp3 to oggs.

var spawn = require('child_process').spawn;
var fs = require('fs');

var spawnFfmpeg = function(inPath, outPath, cb) {
  var ffmpeg = spawn('ffmpeg', [
    '-i', inPath,
    '-acodec', 'libvorbis',
    '-f', 'ogg',              // Output format for the pipe.
    '-aq', 4,                 // VBR quality (>= 128Kbps)
    'pipe:1'                  // Send output to stdout.
  ]);

  // Pipe ffmpeg output to output file.  
  var outStream = fs.createWriteStream(outPath);
  ffmpeg.stdout.pipe(outStream);

  outStream.on('close', function() {
    //console.log('CLOSE: outstream');
    cb();
    ffmpeg.kill();
  });

  ffmpeg.stderr.on('data', function(data) {
   // console.log('DATA', data.toString());
  });

  ffmpeg.stderr.on('end', function () {
    //console.log('ogger: file has been converted successfully;!END: file has been converted succesfully');
  });

};

module.exports = {
  convert: function(inPath, outPath, cb) {
    spawnFfmpeg(inPath, outPath, cb);
  }
};
