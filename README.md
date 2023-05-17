import { Linker } from 'unixevents';
or
const Linker = require('unixevents').Linker;

// Linker(role, channel);

const server = new Linker('server', 'rickshaw');
const client = new Linker('client', 'rickshaw');

server.receive('event-a', data => {
	console.log('Message on server: ', data);
});

client.receive('event-a', data => {
	cosole.log('Message on client: ', data)
})

client.send('event-a', () => 'cool stuff');
server.send('event-a', () => 'cool stuff');

server.close();
client.close();
