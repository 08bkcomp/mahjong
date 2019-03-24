import openSocket from 'socket.io-client';
var port = process.env.PORT || 5000;
//const socket = openSocket('https://mahjong-balaji.herokuapp.com');
const socket = openSocket('http://localhost:' + port);
//const socket = openSocket('https://mahjong-balaji.firebaseapp.com');
export default socket;
