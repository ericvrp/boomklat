import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
import {Howl /*, Howler*/} from 'howler';


//
// const url = window.location.origin
// const url = 'http://localhost:' + (parseInt(window.location.port,10)+1)
// console.log(url)
const socket = io()
socket.on('connect', () => {
  console.log('Connected')
  socket.on('playNote', (message) => {
    // console.log(message)
    const {volume, sample} = message
    new Howl({src:[sample], volume, autoplay:true})
  })
})


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
