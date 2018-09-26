const express = require('express');
const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, 'client/build')));

let fs = require('fs');
let open = require('open');
let options = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem')
};
let serverPort = (process.env.PORT  || 5000);
let https = require('https');
let http = require('http');

let server;
if (process.env.LOCAL) {
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}
let io = require('socket.io')(server, { pingTimeout: 30000 });

// app.get('/', function(req, res){
//   console.log('get /');
//   res.sendFile(__dirname + '/index.html');
// });


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
  if (process.env.LOCAL) {
    open('https://localhost:' + serverPort)
  }
});


//socket
let roomList = {};
function socketIdsInRoom(name) {
  var socketIds = io.nsps['/'].adapter.rooms[name];
  if (socketIds) {
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

io.on('connection', function(socket){
  console.log('connection');
  
  socket.on('disconnect', function(){
    console.log('disconnect');
    if (socket.room) {
      var room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
    }
  });

  // socket.on('leave', function(){
  //   console.log('leave');
  //   if (socket.room) {
  //     var room = socket.room;
  //     io.to(room).emit('leave', socket.id);
  //     socket.leave(room);
  //   }
  // });

  socket.on('join', function(name, callback){
    console.log('join', name);
    var socketIds = socketIdsInRoom(name);
    callback(socketIds);
    socket.join(name);
    socket.room = name;
  });


  socket.on('exchange', function(data){
    console.log('exchange', data);
    data.from = socket.id;
    var to = io.sockets.connected[data.to];
    to.emit('exchange', data);
  });

  socket.on('synctimer', function(data){
    console.log('synctimer', data);
    io.to(data.room).emit('synctimer', data);
  });
});
