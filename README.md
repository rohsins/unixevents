# `unixevents`

Unixevents is a JavaScript library for communicating among programs in a machine.

## Usage

```js
import Linker from 'unixevents';
or
const Linker = require('unixevents');

// Linker(role, channel);

const main = async () => {
    console.log("starting the program");

    const server = new Linker('server', 'R&D-Hardware');
    const client = new Linker('client', 'R&D-Hardware');

    server.receive('event-a', data => {
        console.log('Message on server: ', data);
    });

    client.receive('event-a', data => {
        console.log('Message on client: ', data)
    })

    setTimeout(() => {
        client.send('event-a', 'mesg from client');
        server.send('event-a', 'mesg from server');
    }, 100)

    setTimeout(() => {
        server.close();
        client.close();
    }, 1000);
}

main();
```

```js
import Linker from 'unixevents';
or
const Linker = require('unixevents');

const main = async () => {
    console.log("starting the program");

	let result = false;
	const server = new Linker();
	const client = new Linker();

    result = await server.init('server', 'R&D-Hardware');
    console.log("server initialized: ", result);
    result = await client.init('client', 'R&D-Hardware');
    console.log("client initialized: ", result);

    server.receive('event-a', data => {
        console.log('Message on server: ', data);
    });

    client.receive('event-a', data => {
        console.log('Message on client: ', data)
    })

    client.send('event-a', 'mesg from client');
    server.send('event-a', 'mesg from server');

    setTimeout(() => {
        server.close();
        client.close();
    }, 10);
}

main();
```
