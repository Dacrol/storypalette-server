# storypalette-server

REST API and Websocket server for Storypalette

## Installing

### Dependencies 

- node.js
- ffmpeg

### Clone and build

```sh
git clone https://github.com/storypalette/storypalette-server.git
cd storypalette-server

cp config/defaultSample.js config/default.js
# Now, edit config/default.js with player username and password.

# Optionally, copy existing resources to /resources
```

## Running

```sh
NODE_ENV=production server.js
```

## Developing
```sh
TODO
```

You may want to edit /etc/hosts for local development:

```
127.0.0.1 api.storypalette.dev
127.0.0.1 editor.storypalette.dev
127.0.0.1 player.storypalette.dev
127.0.0.1 performer.storypalette.dev
127.0.0.1 storypalette.dev
```


