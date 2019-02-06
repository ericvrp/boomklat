import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
import {Howl /*, Howler*/} from 'howler';
// Howler.volume(1.0);


// preload audio samples
// const samples = {
//   'foot.wav': new Howl({src:['foot.wav']}),
//   'green.wav': new Howl({src:['green.wav']}),
//   'red.wav': new Howl({src:['red.wav']}),
//   'blue.wav': new Howl({src:['blue.wav']}),
//   'yellow.wav': new Howl({src:['yellow.wav']}),
//   'orange.wav': new Howl({src:['orange.wav']}),
// }


//
// const url = window.location.origin
// const url = 'http://localhost:' + (parseInt(window.location.port,10)+1)
// console.log(url)
const socket = io()
socket.on('connect', () => {
  console.log('Connected')
  socket.on('playNote', (message) => {
    console.log(JSON.stringify(message))
    const {volume, sample} = message
    // samples[sample].play() // use reloaded (what to do with volume?)
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
