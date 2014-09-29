
var spawn = require('child_process').spawn;
var fs = require('fs');

var inputPath = 'test.mp3';
var inputFile = fs.createReadStream(inputPath);

inputFile.on('error', function(err) {
  console.log(err);
});

var outputPath = 'testo.ogg';
var output_stream = fs.createWriteStream(outputPath);

var ffmpeg = spawn('ffmpeg', [
  '-i', inputPath,
  '-f', 'ogg',
  '-acodec', 'libvorbis',
  'pipe:1'  // Output on stdout
]);
  
//var ffmpeg = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
inputFile.pipe(ffmpeg.stdin);
ffmpeg.stdout.pipe(output_stream);

ffmpeg.stdout.on('data', function (data) {
  //console.log(data.toString());
});

ffmpeg.stdout.on('end', function () {
  console.log('file has been converted succesfully');
});

ffmpeg.stdout.on('exit', function () {
  console.log('child process exited');
});

ffmpeg.stderr.on('data', function (data) {
  console.log('ERR', data.toString());
});
