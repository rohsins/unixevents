import { EventEmitter } from 'events';
import net from 'net';
import fs from 'fs';

const eventEmitter = new EventEmitter();
const parentPath = process.platform === "linux" ? '/tmp/' : ("\\\\.\\pipe\\" + process.env['TMP'] + "\\");
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

    constructor (role: Role, channel: Channel) {
		super();

		if (role && channel) this.init(role, channel);
    }

	async init (role: Role, channel: Channel) {
		this.role = role;
		this.channel = channel;

		// console.log("initializing ", this.role);
		
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
						console.error(e);
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
				if (err) console.error(err);

				resolve(this.client);
			});

			this.client.on('error', _error => {
				console.error(_error);
	
				setTimeout(async () => {
					this.client!.connect(path);
				}, 1000)
			});
			
			this.client.on('end', () => {
				console.log("Client connection ended");
	
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
					console.error(e);
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

	send(event: string, payload: object | string) {
		event = this.role === 'server' ? 's-' + event : 'c-' + event;
		payload = typeof(payload) === 'object' ? JSON.stringify(payload) : payload;
		this.emitData = JSON.stringify({ event, payload });

		this.handle = this.role === 'server' ? this.serverClient : this.client;

		if (this.handle) this.handle.write(this.emitData + ';;');
		else console.error("Handle is null: ", this.handle);
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
