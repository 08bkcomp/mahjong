import openSocket from 'socket.io-client';
var port = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production') {
  const socket = openSocket('https://mahjong-balaji.herokuapp.com');
} else {
  const socket = openSocket('http://localhost:' + port);
}
//const socket = openSocket('https://mahjong-balaji.firebaseapp.com');
export default socket;
