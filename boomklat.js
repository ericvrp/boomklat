#!/usr/bin/env node

var exec = require('child_process').exec
var midi = require('midi')

// Set up a new input.
var input = new midi.input();
// console.log('input:', input);

// Count the available input ports.
var nPorts = input.getPortCount();
// console.log('nPorts:', nPorts);

var portNumber = nPorts - 1;
// console.log('portNumber:', portNumber);

// TODO: search for correct port (UM_ONE in the name)

// Get the name of a specified input port.
var portName = input.getPortName(portNumber);
console.log('portName:', portName);

// Configure a callback.
input.on('message', function(deltaTime, message) {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  const drumInfo = {
    38: {color:'red'   , sample: 'red.wav'   },
    48: {color:'blue'  , sample: 'blue.wav'  },
    45: {color:'green' , sample: 'green.wav' },
    46: {color:'yellow', sample: 'yellow.wav'},
    49: {color:'oranje', sample: 'oranje.wav'},
  }

  const [status, drumNumber, force] = message;
  const drum = drumInfo[drumNumber]
  if (status == 153 && drum) {
    console.log(drum.color, force, drum.sample);
    exec('aplay samples/' + drum.sample);
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
