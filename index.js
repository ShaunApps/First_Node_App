var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis");
var redisClient = redis.createClient();  // initial setup for Redis
var port = process.env.PORT || 5000   // for heroku deployment


// var messages = [];
var storeMessage = function(name, data) {     //creates function that stores messages in redis DB
  var message = JSON.stringify({name: name, data: data});

  redisClient.lpush("messages", message, function(err, response){
    redisClient.ltrim("messages", 0, 9);    //only keeps most recent 10 messages.
  });
};

redisClient.on('error', function(err){      // should throw error on bad connection to Redis
  throw err;
});


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');        //GET request from browser sends client to index.html page
});

io.on('connection', function(socket) {    //listening for connection.


  socket.on('chat message', function(msg) {  //listener for any chat message that is executed

    var nickname = socket.nickname;

    socket.broadcast.emit('chat message', nickname + ": " + msg);
    socket.emit('chat message', nickname + ": " + msg);
    storeMessage(nickname, msg);               //stores the name:user into the database
  });


  socket.on('join', function(name) {       //listener for when someone joins the chat

    socket.nickname = name;
    console.log("ADD", socket.nickname);
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

  socket.on('disconnect', function (name){   //on disconnect, server should ping to client and see who responds
    // console.log("DISCONNECT", name, socket.nickname);  //  <------this was used to debug, to see what is going on
    name = socket.nickname;
    // socket.get('nickname', function(err, name)

    socket.broadcast.emit('remove chatter', name);
      redisClient.srem('chatters', name);

    socket.broadcast.emit('chat message', name + " has left the chat");


  });



});

// io.on('disconnect', function)  prob not this



// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });

http.listen(port, function(){            //for heroku deployment
  // console.log('listening on *:3000');
});
