var path = require('path');

// default = local development

module.exports = {
  api: {
    baseUrl: 'http://api.storypalette.dev:8888/v1/',
  },
  server: {
    environment: 'local',
    port: 8888,
    tokenSecret: 'SECRET_HERE', 
    resources: path.resolve(__dirname, '../resources'), 
    cache: path.resolve(__dirname, '../cache'),
    aws: {
      accessKeyId: 'KEY HERE',
      secretAccessKey: 'SECRET HERE'
    }
  },
  editor: {
    folder: path.resolve(__dirname, '../../storypalette-editor/build'), 
  },
  player: {
    folder: path.resolve(__dirname, '../../storypalette-player/build'), 
  },
  dmxplayer: {
    server: 'http://localhost:8891' 
  },
  performer: {
    folder: path.resolve(__dirname, '../../storypalette-performer-touch/build'), 
  },
  db: {
    name: 'storypalette',
    collections: ['users', 'palettes', 'organisations', 'resources']
  }
};
