import { EventEmitter as EventEmitterDefault } from 'events';
import net from 'net';
import fs from 'fs';

const eventEmitterDefault = new EventEmitterDefault();
const parentPath = '/tmp/';
const sockExtenstion = '.sock';

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
		this.createServer().listen(path);
		return;
	    }
	    fs.unlink(path, err => {
		if (err) {
		    console.error(err);
		    process.exit(0);
		}
		this.createServer().listen(path);
		return;
	    });
	});
    }

    createServer() {
	this.server = net.createServer(client => {
	    this.serverClient = client;
	    this.handleServerClient(client);
	});
	this.handleServer(this.server);
	return this.server;
    }

    handleServer(server) {
	server.on('connect', () => console.log('connected'));
    }

    handleServerClient(client) {
	client.on('data', data => console.log(data.toString()));
    }

    emit(event, payload) {
	try {
	this.emitData = { event, payload };
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
	this.handleClient(this.client);
	return this.client;
    }

    handleClient(client) {
	client.on('data', data => {
	    try {
		this.clientEvent = JSON.parse(data.toString());
		eventEmitterDefault.emit(this.clientEvent.event, this.clientEvent.payload.toString());
	    } catch (e) {
		console.error(e);
	    }
	});
    }

    on(event, func) {
	eventEmitterDefault.on(event, func);
    }

/**************************************************client**************************************************/

}

export { EventEmitter };
