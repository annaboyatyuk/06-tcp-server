'use strict';

require('dotenv').config();

const EventEmitter = require('events');
const net = require('net');

const uuid = require('uuid/v4');

const PORT = process.env.PORT;
const server = net.createServer();

const eventEmitter = new EventEmitter();
const socketPool = {};


let User = function(socket) {

  let id = uuid();
  this.id = id;
  this.nickname = `User-${id}`;
  this.socket = socket;
};



server.on('connection', (socket) => {
  let user = new User(socket);

  console.log('Connection Established!');
  
  socketPool[user.id] = user;
  socket.on('data', (buffer) => dispatcher(user.id, buffer));

  user.socket.write(`
      User Commands:
      - @ll <writes a message to all users>
      - @nickname <change username>
      - @list <shows a list of users>
  `);
});


let parse = (buffer) => {

  let text = buffer.toString().trim();
  if(!text.startsWith('@')) {
    return null;
  }
  let [command, payload] = text.split(/\s+(.*)/);
  let [target, message] = payload ? payload.split(/\s+(.*)/) : [];
  return {command, payload, target, message};
};


let dispatcher = (userId, buffer) => {
  let entry = parse(buffer);
  entry && eventEmitter.emit(entry.command, entry, userId);

};


eventEmitter.on('@all', (data, userId) => {
  for(let connnection in socketPool) {
    let user = socketPool[connnection];
    user.socket.write(`<${socketPool[userId].nickname}>: ${data.payload}\n`);
  }
});


eventEmitter.on('@list', (data, userId) => {
  let listUsers = [];

  for(let connnection in socketPool) {
    let user = socketPool[connnection];
    listUsers.push('\n' + user.nickname);
  }
  socketPool[userId].socket.write(`Users: ${listUsers}\n`);
});


eventEmitter.on('@nickname', (data, userId) => {
  let nickname = socketPool[userId].nickname = data.target;
  console.log(`nickname changed to ${nickname}`);
});


eventEmitter.on('@dm', (data, userId) => {

  let findUser = data.target;

  for(let connnection in socketPool) {
    let user = socketPool[connnection];

    if(findUser === user.nickname) {

      user.socket.write(`<${socketPool[userId].nickname}>: ${data.message}\n`);
    }

  }

});


eventEmitter.on('@quit', (data, userId) => {

  // let 

  for(let connnection in socketPool) {
    let user = socketPool[connnection];
    user.socket.write(`<${user.nickname}>: has left the chat.\n`);
  }

});






server.listen(PORT, () => {
  console.log(`listenting on port ${PORT}`);
});
