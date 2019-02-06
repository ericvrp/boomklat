#!/usr/bin/env node

const exec    = require('child_process').exec
const midi    = require('midi')
const express = require('express')
const app     = express()
const server  = require('http').Server(app)
const io      = require('socket.io')(server)
const rpio    = require('rpio')


// settings
const HTTP_PORT        = process.env.HTTP_PORT || 3001
const PLAY_ON_SERVER   = false
const MIDI_NOTE_ON          = 153 // 0x99
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
    // console.warn('Warning: no message')
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

  if (status === MIDI_NOTE_ON && drum) {
    let volume = (force + drum.volumeOffset) * drum.volumeMultiplier / 256.0
    volume = Math.max(volume, 0.1)
    volume = Math.min(volume, 5.0)
    console.log(drum.color, volume.toFixed(1), drum.sample)
    io.sockets.emit('playNote', {volume:volume.toFixed(1), 'sample':drum.sample})

    if (PLAY_ON_SERVER) {
      const cmd = `play -v ${volume.toFixed(1)} public/${drum.sample}`
      // console.log(cmd)
      exec(cmd)
    }
  } else {
    console.warn('Warning: unknown message', message)
  }
} // end of playNote()


//
const handleKeyboard = () => {
  const stdin = process.stdin
  stdin.setRawMode(true)    // without this, we would only get streams once enter is pressed
  stdin.resume()            // resume stdin in the parent process (node app won't quit all by itself unless an error or process.exit() happens)
  stdin.setEncoding('utf8') // not binary

  console.log('Keyboard forwarding enabled')

  // on any data into stdin
  stdin.on( 'data', function( key ){
    // ctrl-c ( end of text )
    if ( key === '\u0003' ) {
      process.exit()
    }
    // write the key to stdout all normal like
    // process.stdout.write( key )
    const key2Message = {
      ' ': [MIDI_NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  2],

      'z': [MIDI_NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  1],
      'x': [MIDI_NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  1],
      'c': [MIDI_NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  1],
      'v': [MIDI_NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  1],
      'b': [MIDI_NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  1],
      'n': [MIDI_NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  1],

      'a': [MIDI_NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  2],
      's': [MIDI_NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  2],
      'd': [MIDI_NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  2],
      'f': [MIDI_NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  2],
      'g': [MIDI_NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  2],
      'h': [MIDI_NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  2],

      'q': [MIDI_NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  4],
      'w': [MIDI_NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  4],
      'e': [MIDI_NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  4],
      'r': [MIDI_NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  4],
      't': [MIDI_NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  4],
      'y': [MIDI_NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  4],

      '1': [MIDI_NOTE_ON, DRUM_FOOT  , VOLUME_THRESHOLD *  6],
      '2': [MIDI_NOTE_ON, DRUM_RED   , VOLUME_THRESHOLD *  6],
      '3': [MIDI_NOTE_ON, DRUM_BLUE  , VOLUME_THRESHOLD *  6],
      '4': [MIDI_NOTE_ON, DRUM_GREEN , VOLUME_THRESHOLD *  6],
      '5': [MIDI_NOTE_ON, DRUM_YELLOW, VOLUME_THRESHOLD *  6],
      '6': [MIDI_NOTE_ON, DRUM_ORANGE, VOLUME_THRESHOLD *  6],
    }

    // console.log( key2Message[key] )
    playNote(key2Message[key])
  })
} // end of handleKeyboard()


//
const handleUsb = () => {
  const input = new midi.input() // Set up a new input.

  const nPorts = input.getPortCount()
  for (var portNumber = 0;portNumber < nPorts;portNumber++) {
    const portName = input.getPortName(portNumber)
    // console.log(portName)
    if (!portName.includes('Midi Through'))
      break
  }
  if (portNumber >= nPorts) {
    console.warn('Warning: not forwarding midi events (midi to usb interface not found)')
    return
  }

  console.log('Midi (through usb) forwarding enabled')

  input.on('message', function(deltaTime, message) {
    playNote(message)
  })

  var openPort = input.openPort(portNumber) // Open the first available input port (midi->usb interface)

  // Sysex, timing, and active sensing messages are ignored
  // by default. To enable these message types, pass false for
  // the appropriate type in the function below.
  // Order: (Sysex, Timing, Active Sensing)
  // For example if you want to receive only MIDI Clock beats
  // you should use
  // input.ignoreTypes(true, false, true)
  var ignoreTypes = input.ignoreTypes(false, false, false)

  // var closePort = input.closePort() // Close the port when done.
} // end of handleUsb()


//
const startServer = () => {
  server.listen(HTTP_PORT, () => console.log(`Events server running on http://localhost:${HTTP_PORT}`))

  // app.get('/', (req, res) => {res.send('Hello World!') })
  // app.use(express.static('public'))

  // io = require('socket.io')(HTTP_PORT+1)
  // console.log(`Socket.io on http://localhost:${HTTP_PORT+1}`)

  io.on('connection', (socket) => {
    console.log('New connection to', socket.id)
  })
} // end of startServer()


//
handleUsb()
handleKeyboard()
startServer()


// the end
