var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var client = redis.createClient();


var messages = [];
var storeMessage = function(name, data) {
  messages.push({name: name, data: data});
  if (messages.length > 10) {
    messages.shift();
  }
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {


  socket.on('chat message', function(msg) {

    var nickname = socket.nickname;

    socket.broadcast.emit('chat message', nickname + ": " + msg);
    socket.emit('chat message', nickname + ": " + msg);
    storeMessage(nickname, msg);
  });


  socket.on('join', function(name) {
    socket.nickname = name;
    socket.broadcast.emit('chat message', name + " has joined the chat");
    messages.forEach(function(message) {
      socket.emit('chat message', message.name + ": " + message.data);
    });
  });

  // socket.on('disconnect', function (){
  //   socket.nickname = name;
  //   socket.emit('chat message', name + " has left the chat");
  // });



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
