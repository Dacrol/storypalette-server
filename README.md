# storypalette-server

> REST API and Websocket server for Storypalette

- Serves static resources: html, images and sounds
- Serves REST API endpoints at http://api.storypalette.net
- Handles database operations
- Coordinates websocket communication between Performers and Players

## Run

```sh
npm start
```

## Develop

### First time

- Clone repo
- Add `.env` file with secret stuff

### Then

```sh
npm run watch   # requires nodemon
```
