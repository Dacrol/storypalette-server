var spawn = require('child_process').spawn;
var fs = require('fs');

var inPath = 'test.mp3';
var outPath = 'testo.ogg';
var outStream = fs.createWriteStream(outPath);

var ffmpeg = spawn('ffmpeg', [
  '-i', inPath,
  '-acodec', 'libvorbis',
  '-f', 'ogg',                // Output format for the pipe.
  'pipe:1'                    // Send output to sdtout.
]);
  
// Pipe ffmpeg output to output file.  
ffmpeg.stdout.pipe(outStream);

outStream.on('close', function() {
  console.log('CLOSE: outstream');
  ffmpeg.kill();
});

ffmpeg.stderr.on('exit', function() {
  console.log('EXIT: child process exited');
});

ffmpeg.stderr.on('data', function(data) {
  console.log('DATA', data.toString());
});

ffmpeg.stderr.on('end', function () {
  console.log('END: file has been converted succesfully');
});
