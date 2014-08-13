// Middleware for sharing server environment variables to client.
// by injecting a javascript object `window.env`
module.exports = function(config) {
  
  var info = {
    apiBase: config.api.baseUrl, 
    environment: config.server.environment
  };

  return function(req, res) {
    var test = {testo: 'apa'};
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', 0);

    res.send('window.env = ' + JSON.stringify(info) + ';');
  };

};
