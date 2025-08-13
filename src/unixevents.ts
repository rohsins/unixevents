import { EventEmitter } from 'events';
import net from 'net';
import fs from 'fs';

const eventEmitter = new EventEmitter();
const parentPath = (process.platform === "linux" || process.platform === "darwin") ? '/tmp/' : ("\\\\.\\pipe\\" + process.env['TMP'] + "\\");
const sockExtension = '.sock';

type Role = "server" | "client";
type Channel = string;

class Linker extends EventEmitter {
    role?: Role;
    channel?: Channel;
    server?: net.Server;
    serverClient?: net.Socket;
    dataArray?: Array<string>;
    serverEvent?: {
	event: string,
	payload: Object | string;
    };
    client?: net.Socket;
    clientEvent?: {
	event: string,
	payload: Object | string;
    };
    emitData?: string;
    handle?: net.Socket | undefined;
    debug: Boolean = false;

    consoleLog (...args: any) {
	if (this.debug) console.log(args);
    }

    consoleError (...args: any) {
	if (this.debug) console.error(args);
    }

    enableDebug () {
	this.debug = true;
    }

    disableDebug () {
	this.debug = false;
    }

    constructor (role: Role, channel: Channel) {
	super();

	if (role && channel) this.init(role, channel);
    }

    async init (role: Role, channel: Channel) {
	this.role = role;
	this.channel = channel;

	// this.consoleLog("initializing ", this.role);

	switch (this.role) {
	    case 'server':
		return await this.serverRoutine(parentPath + this.channel + sockExtension);
	    // break;
	    case 'client':
		return await this.clientRoutine(parentPath + this.channel + sockExtension);
	    // break;
	    default:
		throw new Error('Error: no role specified');
	}
    }

    /**************************************************server**************************************************/

    async createServer (path: string) {
	return new Promise((resolve, reject) => {
	    if (fs.existsSync(path)) fs.unlink(path, () => {});

	    this.server = net.createServer(client => {
		this.serverClient = client;

		this.serverClient.on('data', dataPacket => {
		    try {
			(this.dataArray = dataPacket.toString().split(';;')).splice(-1);
			this.dataArray.forEach(data => {
			    this.serverEvent = JSON.parse(data.toString());
			    eventEmitter.emit(this.serverEvent!.event, this.serverEvent!.payload.toString());
			});
		    } catch (e) {
			this.consoleError(e);
		    }
		});
	    });

	    this.server.on('error', async (error: { code: string }) => {
		if (error.code === 'EADDRINUSE') {
		    fs.unlink(path, () => {});
		    reject(error);
		}
	    });

	    this.server.listen({ path }, () => {
		// if (err) reject(err);
		resolve(this.server);
	    });
	});
    }

    async serverRoutine (path: string) {
	let retry = 10;

	while (!await this.createServer(path).then(_ => true).catch(_ => false)) {
	    retry--;

	    if (!retry) return false;
	}

	return true;
    }

    /**************************************************server**************************************************/

    /**************************************************client**************************************************/

    async createClientConnection (path: string) {
	return new Promise((resolve, _reject) => {
	    this.client = net.createConnection({ path }, () => {
		// if (err) _reject(err);
		// resolve(this.client);
	    });

	    this.client.on('connect', (err: Error) => {
		if (err) this.consoleError(err);

		resolve(this.client);
	    });

	    this.client.on('error', _error => {
		this.consoleError(_error);

		setTimeout(async () => {
		    this.client!.connect(path);
		}, 1000)
	    });

	    this.client.on('end', () => {
		this.consoleLog("Client connection ended");

		setTimeout(async () => {
		    this.client!.connect(path);
		}, 1000)
	    });

	    this.client.on('data', dataPacket => {
		try {
		    (this.dataArray = dataPacket.toString().split(';;')).splice(-1);
		    this.dataArray.forEach(data => {
			this.clientEvent = JSON.parse(data.toString());
			eventEmitter.emit(this.clientEvent!.event, this.clientEvent!.payload.toString());
		    });
		} catch (e) {
		    this.consoleError(e);
		}
	    });
	})
    }

    async clientRoutine (path: string) {
	return await this.createClientConnection(path).then(_ => true).catch(_ => false);
    }

    /**************************************************client**************************************************/

    receive(event: string, func: any) {
	switch (this.role) {
	    case 'server':
		eventEmitter.on('c-' + event, func);
		break;
	    case 'client':
		eventEmitter.on('s-' + event, func);
		break;
	}
    }

    receiveOnce(event: string, func: any) {
	switch (this.role) {
	    case 'server':
		eventEmitter.once('c-' + event, func);
		break;
	    case 'client':
		eventEmitter.once('s-' + event, func);
		break;
	}
    }

    removeReceiver(event: string, func: any) {
	switch (this.role) {
	    case 'server':
		eventEmitter.off('c-' + event, func);
		break;
	    case 'client':
		eventEmitter.off('s-' + event, func);
		break;
	}
    }

    send(event: string, payload: object | string, callback: Function) {
	event = this.role === 'server' ? 's-' + event : 'c-' + event;
	payload = typeof(payload) === 'object' ? JSON.stringify(payload) : payload;
	this.emitData = JSON.stringify({ event, payload });
	this.handle = this.role === 'server' ? this.serverClient : this.client;

	if (this.handle) {
	    this.handle.write(this.emitData + ';;', err => {
		if (err) callback(err);
		else callback(null, true);
	    });
	} else {
	    this.consoleError("Socket handle is null: ", this.handle);
	    callback(new Error("Socket handle is null"));
	}
    }

    sendSync(event: string, payload: object | string): Promise<Error | null | undefined | boolean> {
	return new Promise((resolve, reject) => {
	    event = this.role === 'server' ? 's-' + event : 'c-' + event;
	    payload = typeof(payload) === 'object' ? JSON.stringify(payload) : payload;
	    this.emitData = JSON.stringify({ event, payload });
	    this.handle = this.role === 'server' ? this.serverClient : this.client;

	    if (this.handle) {
		this.handle.write(this.emitData + ';;', err => {
		    if (err) return reject(err);
		    return resolve(true);
		});
	    } else {
		this.consoleError("Socket handle is null: ", this.handle);
		return reject(new Error("Socket handle is null"));
	    }
	});
    }

    close() {
	switch (this.role) {
	    case 'server':
		if (this.server) {
		    this.server.removeAllListeners();
		    this.server.close();
		}
		break;
	    case 'client':
		if (this.client) {
		    this.client.end();
		    this.client.destroy();
		}
		break;
	}
    }
}

export default Linker;

