var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis");
var redisClient = redis.createClient();


var messages = [];
var storeMessage = function(name, data) {
  var message = JSON.stringify({name: name, data: data});

  redisClient.lpush("messages", message, function(err, response){
    redisClient.ltrim("messages", 0, 9);
  });
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

    socket.broadcast.emit('add chatter', name);
    redisClient.smembers('names', function(err, names){
      names.forEach(function(name){
        socket.emit('add chatter', name);
      });

    });
    redisClient.sadd('chatters', name);


   redisClient.lrange("messages", 0, -1, function(err, messages){
    messages = messages.reverse();

     messages.forEach(function(message) {
       message = JSON.parse(message);
       socket.emit('chat message', message.name + ": " + message.data);
     });
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
