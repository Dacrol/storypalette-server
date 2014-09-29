
var spawn = require('child_process').spawn;
var fs = require('fs');

var inPath = 'test.mp3';
var inFile = fs.createReadStream(inPath);

inFile.on('error', function(err) {
  console.log(err);
});

var outPath = 'testo.ogg';
var outStream = fs.createWriteStream(outPath);

//try {
  var ffmpeg = spawn('ffmpeg', [
    '-i', inPath,
    '-f', 'ogg',
    '-acodec', 'libvorbis',
    'pipe:1'  // Output on stdout
  ]);
//} catch (e) {
  //console.log('ERR:', e);
}
  
//var ffmpeg = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
//inFile.pipe(ffmpeg.stdin);
//ffmpeg.stdout.pipe(outStream);

ffmpeg.stdout.on('end', function () {
  console.log('file has been converted succesfully');
});

ffmpeg.stdout.on('exit', function () {
  console.log('child process exited');
});

ffmpeg.stderr.on('data', function (data) {
  console.log('ERR', data.toString());
});
