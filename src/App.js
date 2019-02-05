import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';


//
const url = 'http://localhost:' + (parseInt(window.location.port,10)+1)
// console.log(url)
const socket = io(url)
// socket.on('connect', () => console.log('Connected'))
socket.on('playNote', message => console.log(message))


//
class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>
            boomklat
          </p>
        </header>
      </div>
    );
  }
}

export default App;
