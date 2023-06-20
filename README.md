# `unixevents`

Unixevents is a JavaScript library for communicating among programs in a machine.

## Usage

```js
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

client.send('event-a', () => 'mesg from client');
server.send('event-a', () => 'mesg from server');

server.close();
client.close();
```
