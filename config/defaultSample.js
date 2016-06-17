var path = require('path');

// default = local development

module.exports = {
  api: {
    baseUrl: 'http://api.storypalette.dev:8888/v1/',
  },
  server: {
    port: 8888,
    tokenSecret: 'SECRET_HERE', 
    resources: path.resolve(__dirname, '../resources'), 
    aws: {
      accessKeyId: 'KEY HERE',
      secretAccessKey: 'SECRET HERE'
    }
  },
  db: {
    user: '<dbuser>',
    password: '<dbpass>',
    name: 'ds019048.mlab.com:19048/storypalette',
    collections: ['users', 'palettes', 'organisations', 'resources']
  }
};
