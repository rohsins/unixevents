import Linker from 'unixevents';
or
const Linker = require('unixevents');

// Linker(role, channel);

const server = new Linker('server', 'R&D-Hardware');
const client = new Linker('client', 'R&D-Hardware');

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
