# storypalette-server

> Backend for the Storypalette system: REST API, HTTP/Websocket server, and some database utils.

## Installing

1. Make sure you have the prerequisites: 

node.js
```sh
brew install freeimage
brew install mongodb
sudo npm install -g grunt-cli

```

2. Clone and build:

```sh
git clone https://github.com/storypalette/storypalette-server.git
cd storypalette-server
npm install imops
grunt collate
```

3. Add super-secret config files (talk to Erik for now).

## Running

```sh
cd storypalette-server
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


