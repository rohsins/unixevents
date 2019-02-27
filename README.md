import { EventEmitter } from 'unixevents';
or
const EventEmitter = require('unixevents').EventEmitter;

// EventEmitter(role, channel);

const emitter = new EventEmitter('server', 'rickshaw');
const listener = new EventEmitter('client', 'rickshaw');

listener.on('connecto', data => {
	console.log('data: ', data);
});

emitter.emit('connecto', () => 'cool stuff');