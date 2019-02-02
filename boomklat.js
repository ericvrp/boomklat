#!/usr/bin/env node

const exec = require('child_process').exec
const midi = require('midi')

// Set up a new input.
const input = new midi.input();

const nPorts = input.getPortCount();
// console.log('nPorts:', nPorts);
for (var portNumber = 0;portNumber < nPorts;portNumber++) {
  if (input.getPortName(portNumber).includes('UM-ONE'))
    break
}

// console.log('portNumber:', portNumber);

// const portName = input.getPortName(portNumber);
// console.log('portName:', portName);

// Configure a callback.
input.on('message', function(deltaTime, message) {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  const drumInfo = {
    36: {color:'foot'  , volumeMultiplier:20.0, sample:'foot.wav'  },
    38: {color:'red'   , volumeMultiplier: 9.0, sample:'red.wav'   },
    48: {color:'blue'  , volumeMultiplier: 5.0, sample:'blue.wav'  },
    45: {color:'green' , volumeMultiplier:15.0, sample:'green.wav' },
    46: {color:'yellow', volumeMultiplier:10.0, sample:'yellow.wav'},
    49: {color:'orange', volumeMultiplier:10.0, sample:'orange.wav'},
  }

  const [status, drumNumber, force] = message;
  const drum = drumInfo[drumNumber]
  if (status == 153 && drum) {
    const volume = force * drum.volumeMultiplier / 256.0;
    console.log(drum.color, volume, drum.sample);
    const cmd = `play -v ${volume} samples/${drum.sample}`
    // console.log(cmd);
    exec(cmd);
  } else {
     console.log('message:', message, ', deltaTime:', deltaTime);
  }
});

// Open the first available input port
var openPort = input.openPort(portNumber);
// console.log('openPort:', openPort);

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
var ignoreTypes = input.ignoreTypes(false, false, false);
// console.log('ignoreTypes', ignoreTypes);

// ... receive MIDI messages ...

// Close the port when done.
// var closePort = input.closePort();
// console.log('closePort', closePort);
