# storypalette-server

> Backend for the Storypalette system: REST API, HTTP/Websocket server, and some database utils.

## Installing

### Prerequisites 

- node.js
- homebrew

```sh
brew install freeimage
brew install mongodb
sudo npm install -g grunt-cli
```

### Clone and build

```sh
git clone https://github.com/storypalette/storypalette-server.git
cd storypalette-server
npm install imops

cp config/defaultSample.js config/default.js
# Now, edit config/default.js with player username and password.
```

## Running

```sh
NODE_ENV=production server.js
```

## Developing
```sh
grunt serve
```

You may want to edit /etc/hosts for local development:

```
127.0.0.1 api.storypalette.dev
127.0.0.1 editor.storypalette.dev
127.0.0.1 player.storypalette.dev
127.0.0.1 performer.storypalette.dev
127.0.0.1 storypalette.dev
```


