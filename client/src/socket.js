import openSocket from 'socket.io-client';
var port = process.env.PORT || 5000;
const socket = openSocket('http://localhost:' + port);
export default socket;
