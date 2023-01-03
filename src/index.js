const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const socketio = require("socket.io");
const Filter = require('bad-words');
const { generateMessage, generateLocationMessages } = require("../public/utils/messages")
const {addUser, removeUser, getUser,  getUsersInRoom} = require("../public/utils/users")

dotenv.config({ path: "src/configurations/config.env" });

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

// let count = 0;

io.on("connection", (socket) => {
  //socket is an object which contains information about connections
  console.log("New websocket connection");

  // socket.emit("countUpdated", count); //to send event
  // socket.on("increment", () => {
  //   count++;
  //   io.emit("countUpdated", count);
  // });
  

  socket.on("join", ({username, room}, callback)=>{
    const {error, user} = addUser({id: socket.id, username, room});

    if(error){
      return callback(error);
    }

    socket.join(user.room)
    socket.emit("newMessage", generateMessage("System", "Welcome"));
    socket.broadcast.to(user.room).emit("newMessage", generateMessage("System",`${user.username} has joined`));
    io.to(user.room).emit('roomData',{
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback();
  })

  socket.on("sendMessage", (message ,callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();
    if(filter.isProfane(message)){
      return callback('Profanity is not allowed')
    }
    io.to(user.room).emit("newMessage", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (position, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessages(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`)
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if(user){
      io.to(user.room).emit("newMessage", generateMessage("System",`${user.username} has left!`));
      io.to(user.room).emit('roomData',{
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("Server is running on port " + port);
});
