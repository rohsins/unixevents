import { EventEmitter as EventEmitterDefault } from 'events';
import net from 'net';
import fs from 'fs';

const eventEmitterDefault = new EventEmitterDefault();
const parentPath = '/tmp/';
const sockExtension = '.sock';

class EventEmitter {
    constructor(role, channel) {
	switch (role) {
	case 'server':
	    this.serverRoutine(parentPath + channel + sockExtension);
	    break;
	case 'client':
	    this.clientRoutine(parentPath + channel + sockExtension);
	    break;
	default:
	    throw new Error('Error: no role specified');
	    break;
	}
    }

/**************************************************server**************************************************/
    
    serverRoutine(path) {
	fs.stat(path, (err, stats) => {
	    if (err) {
		this.createServer(path).listen(path);
		return;
	    }
	    fs.unlink(path, err => {
		if (err) {
		    console.error(err);
		    process.exit(0);
		}
		this.createServer(path).listen(path);
		return;
	    });
	});
    }

    createServer(path) {
	this.server = net.createServer(client => {
	    this.serverClient = client;
	    this.handleServerClient(client);
	});
	this.handleServer(this.server, path);
	return this.server;
    }

    handleServer(server, path) {
	// server.on('connect', () => console.log('connected'));
	server.on('error', error => {
	    if (error.code === 'EADDRINUSE') {
		setTimeout(() => {
		    server.close();
		    server.listen(path);
		}, 1000);
	    }
	});
    }

    handleServerClient(client) {
	// client.on('data', data => console.log(data.toString()));
    }

    emit(event, payload) {
	try {
	    if (typeof(payload) === 'object') {
		this.emitData = { event, payload: JSON.stringify(payload) };
	    } else {
		this.emitData = { event, payload };
	    }
	    this.serverClient.write(JSON.stringify(this.emitData));
	} catch (e) {
	    console.error(e);
	}
    }



/**************************************************server**************************************************/

/**************************************************client**************************************************/

    clientRoutine(path) {
	this.createClient(path);
    }

    createClient(path) {
	try {
	    this.client = net.createConnection({ path });
	} catch (e) {
	    console.error('exception: ', e);
	}
	this.handleClient(this.client, path);
	return this.client;
    }

    handleClient(client, path) {
	client.on('data', data => {
	    try {
		this.clientEvent = JSON.parse(data.toString());
		eventEmitterDefault.emit(this.clientEvent.event, this.clientEvent.payload.toString());
	    } catch (e) {
		console.error(e);
	    }
	});
	
	client.on('error', error => {
	    setTimeout(() => this.createClient(path), 1000);
	});

	client.on('end', () => {
	    setTimeout(() => this.createClient(path), 1000);
	});
    }

    on(event, func) {
	eventEmitterDefault.on(event, func);
    }

/**************************************************client**************************************************/

}

export { EventEmitter };
