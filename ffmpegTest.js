var ffmpeg = require('fluent-ffmpeg');

ffmpeg('test.mp3')
  .on('end', function() {
    console.log('Finished processing');
  })
  .on('error', function(err, ffmpegOut, ffmpegErr) {
    console.log('err', err);
    console.log('ffmpeg error: ' + ffmpegErr);
  })
  .audioCodec('libvorbis')
  .outputFormat('ogg')
  .save('test.ogg');
