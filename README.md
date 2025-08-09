# `Unixevents`

Unixevents is a JavaScript library for communicating among programs in a machine.

## Table of Contents

- [Installation](#installation)
- [Import Styles](#import-styles)
- [Example](#example)
- [API](#api)

## Installation

```sh
npm install unixevents --save
```

## Import styles

### CommonJS (Require)

```js
const Linker = require('unixevents');
```

### ES6 Modules (Import)

#### Default import

```js
import Linker from 'unixevents';
```

## Example

Program 1

```js
const Linker = require('unixevents');

const server = new Linker('server', 'Channel1');

server.receive('event-s-a', data => {
    console.log('Message on server: ', data);
});

setTimeout(() => {
    server.send('event-c-a', 'Mesg from server');
}, 100);

setTimeout(() => {
    server.close();
}, 1000);
```

Program 2

```js
const Linker = require('unixevents');

const client = new Linker('client', 'Channel1');

client.receive('event-c-a', data => {
    console.log('Message on client: ', data);
});

setTimeout(() => {
    client.send('event-s-a', 'Mesg from client');
}, 100);

setTimeout(() => {
    client.close();
}, 1000);
```

Constructor without an argument

Program 1

```js
const Linker = require('unixevents');

const main = async () => {
	let result = false;
	const server = new Linker();

    result = await server.init('server', 'Channel2');
    console.log("server initialized: ", result);

    server.receive('event-sa', data => {
        console.log('Message on server: ', data);
    });

    server.send('event-ca', 'Mesg from server');

    setTimeout(() => {
        server.close();
    }, 10);
}

main();
```

Program 2

```js
const Linker = require('unixevents');

const main = async () => {
	let result = false;
	const client = new Linker();

    result = await client.init('client', 'channel2');
    console.log("client initialized: ", result);

    client.receive('event-ca', data => {
        console.log('Message on client: ', data);
    });

    client.send('event-sa', 'Mesg from client');

    setTimeout(() => {
        client.close();
    }, 10);
}

main();
```

## API

- [`new Linker()`](#new-linker)
- [`new Linker(role, channel)`](#new-linkerrole-channel)
- [`init(role, channel)`](#initrole-channel)
- [`receive(event, listener)`](#receiveevent-listener)
- [`receiveOnce(event, listener)`](#receiveonceevent-listener)
- [`send(event, data)`](#sendevent-data)
- [`sendSync(event, data)`](#sendsyncevent-data)
- [`close()`](#close)

---

### `new Linker()`

Creates a new instance of Linker without an initialization.

If the object is instantiated with `new Linker()` without arguments, then it needs to invoke .init(role, channel) to initialized the object.

```js
    let router = new Linker();
    router.init('server', 'lcp');
```

---

### `new Linker(role, channel)`

Creates a new instance of Linker with initialization.

If the object is instantiated with `new Linker(role, channel)` with arguments, then it does not need to invoke .init(role, channel) to initialized the object.

- role: can be either 'server' or 'client'.
- channel: placeholder for a channel.

```js
    let router = new Linker('server', 'lcp');
```

---

### `init(role, channel)`

Initialize the object with the role and channel

- role: can be either 'server' or 'client'.
- channel: placeholder for a channel.
- Returns a promise. success: true, failure: false.

```js
    let router = new Linker();
    await router.init('server', 'lcp');
```

---

### `receive(event, listener)`

Subscribes to the event

- event (required): The event to subscribe to.
- listener (required): The event listener callback

```js
    router.receive('link-up', data => {
        console.log(data);
    });
```

---

### `receiveOnce(event, listener)`

Subscribes to the event once, then automatically unsubscribes after receiving the first data.

- event (required): The event to subscribe to.
- listener (required): The event listener callback

```js
    router.receiveOnce('link-up', data => {
        console.log(data);
    });
```

---

### `send(event, data)`

Invokes an event asynchronously, optionally with data.

- event (required): The event to invoke.
- data (required): The data to pass to the event listener. String or Object or Array

```js
    router.send('link-up', { status: "up" });
```

---

### `sendSync(event, data)`

Invokes an event synchronously, optionally with data.

- event (required): The event to invoke.
- data (required): The data to pass to the event listener. String or Object or Array

```js
    await router.sendSync('link-up', { status: "up" });
```

---

### `close()`

Kills the Linker object.

```js
    router.close();
```

---
