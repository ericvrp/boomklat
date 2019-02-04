#!/usr/bin/env node

const exec = require('child_process').exec
const midi = require('midi')


// settings
const PORT_NAME   = 'UM-ONE'

const NOTE_ON     = 153

const VOLUME_THRESHOLD = 25

const DRUM_FOOT   = 36
const DRUM_RED    = 38
const DRUM_BLUE   = 48
const DRUM_GREEN  = 45
const DRUM_YELLOW = 46
const DRUM_ORANGE = 49


//
const playNote = (message) => {
  if (!message) {
    // console.info('warning: no message')
    return
  }

  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  const drumInfo = {}
  drumInfo[DRUM_FOOT  ] = {color:'foot'  , volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'foot.wav'  }
  drumInfo[DRUM_RED   ] = {color:'red'   , volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'red.wav'   }
  drumInfo[DRUM_BLUE  ] = {color:'blue'  , volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'blue.wav'  }
  drumInfo[DRUM_GREEN ] = {color:'green' , volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'green.wav' }
  drumInfo[DRUM_YELLOW] = {color:'yellow', volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'yellow.wav'}
  drumInfo[DRUM_ORANGE] = {color:'orange', volumeOffset:-VOLUME_THRESHOLD, volumeMultiplier:5.0, sample:'orange.wav'}

  const [status, drumNumber, force] = message
  const drum = drumInfo[drumNumber]
  // console.log(drum, drumNumber, drumInfo)

  if (status === NOTE_ON && drum) {
    let volume = (force + drum.volumeOffset) * drum.volumeMultiplier / 256.0
    volume = Math.max(volume, 0.1)
    volume = Math.min(volume, 5.0)
    console.log(drum.color, volume.toFixed(1), drum.sample)
    const cmd = `play -v ${volume.toFixed(1)} samples/${drum.sample}`
    // console.log(cmd)
    exec(cmd)
  } else {
    console.info('warning: unknown message', message)
  }
} // end of playNote()


//
const handleKeyboard = () => {
  var stdin = process.stdin

  // without this, we would only get streams once enter is pressed
  stdin.setRawMode( true )

  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  stdin.resume()

  // i don't want binary, do you?
  stdin.setEncoding( 'utf8' )

  // on any data into stdin
  stdin.on( 'data', function( key ){
    // ctrl-c ( end of text )
    if ( key === '\u0003' ) {
      process.exit()
    }
    // write the key to stdout all normal like
    // process.stdout.write( key )
    const key2Message = {
      ' ': [NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  3],

      'z': [NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  1],
      'x': [NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  1],
      'c': [NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  1],
      'v': [NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  1],
      'b': [NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  1],
      'n': [NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  1],

      'a': [NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  3],
      's': [NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  3],
      'd': [NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  3],
      'f': [NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  3],
      'g': [NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  3],
      'h': [NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  3],

      'q': [NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  6],
      'w': [NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  6],
      'e': [NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  6],
      'r': [NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  6],
      't': [NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  6],
      'y': [NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  6],

      '1': [NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  9],
      '2': [NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  9],
      '3': [NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  9],
      '4': [NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  9],
      '5': [NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  9],
      '6': [NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  9],
    }

    // console.log( key2Message[key] )
    playNote(key2Message[key])
  })
} // end of handleKeyboard()


//
const handleUsb = () => {
  // Set up a new input.
  const input = new midi.input()

  const nPorts = input.getPortCount()
  // console.log('nPorts:', nPorts)
  for (var portNumber = 0;portNumber < nPorts;portNumber++) {
    if (input.getPortName(portNumber).includes(PORT_NAME))
      break
  }
  if (portNumber >= nPorts) {
    console.info('warning:', PORT_NAME, 'usb port not found')
    return
  }

  // console.log('portNumber:', portNumber)

  // const portName = input.getPortName(portNumber)
  // console.log('portName:', portName)

  // Configure a callback.
  input.on('message', function(deltaTime, message) {
    playNote(message)
  })

  // Open the first available input port
  var openPort = input.openPort(portNumber)
  // console.log('openPort:', openPort)

  // Sysex, timing, and active sensing messages are ignored
  // by default. To enable these message types, pass false for
  // the appropriate type in the function below.
  // Order: (Sysex, Timing, Active Sensing)
  // For example if you want to receive only MIDI Clock beats
  // you should use
  // input.ignoreTypes(true, false, true)
  var ignoreTypes = input.ignoreTypes(false, false, false)
  // console.log('ignoreTypes', ignoreTypes)

  // ... receive MIDI messages ...

  // Close the port when done.
  // var closePort = input.closePort()
  // console.log('closePort', closePort)
} // end of handleUsb()


//
handleUsb()
handleKeyboard()


// the end
