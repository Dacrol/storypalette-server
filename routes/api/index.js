
function createGetActivity(io, orgs) {

  return function getActivity(req, res) {
    var info = {};
    
    // Get all room names per namespace
    _.each(io.nsps, function(ns) {
      info[ns.name] = {
        name: ns.name, 
        organisationName: orgs[ns.name],
        rooms: {}
      };

      // All the sockets connected to this namespace.
      _.each(ns.connected, function(socket) {
        if (!info[ns.name].rooms[socket.spRoom]) {
          info[ns.name].rooms[socket.spRoom] = {
            name: socket.spRoom,
            clients: []
          };
        }

        info[ns.name].rooms[socket.spRoom].clients.push({
          socketId: socket.id,
          user: socket.spUser
        });
      });
    });

    delete info['/'];
    res.json(info);
  }

}

module.exports = {
  getActivity: createGetActivity(io, orgs)
};
