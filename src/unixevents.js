import { EventEmitter } from 'events';
import net from 'net';
import fs from 'fs';

const eventEmitter = new EventEmitter();
const parentPath = '/tmp/';
const sockExtension = '.sock';

class Linker extends EventEmitter {
    constructor (role, channel) {
		super(role, channel);
		this.role = role;
		this.channel = channel;

		this.init();
    }
	
	async init () {
		console.log("initializing ", this.role);
		
		switch (this.role) {
			case 'server':
				await this.serverRoutine(parentPath + this.channel + sockExtension);
				break;
			case 'client':
				await this.clientRoutine(parentPath + this.channel + sockExtension);
				break;
			default:
				throw new Error('Error: no role specified');
		}
	}

/**************************************************server**************************************************/
    
	async createServer (path) {
		return new Promise((resolve, reject) => {
			this.server = net.createServer(client => {
				this.serverClient = client;

				this.serverClient.on('data', dataPacket => {
					try {
						(this.dataArray = dataPacket.toString().split(';;')).splice(-1);
						this.dataArray.forEach(data => {
							this.serverEvent = JSON.parse(data.toString());
							eventEmitter.emit(this.serverEvent.event, this.serverEvent.payload.toString());
						});
					} catch (e) {
						console.error(e);
					}
				});
			});
			
			this.server.on('error', async error => {
				if (error.code === 'EADDRINUSE') {
					fs.unlink(parentPath + this.channel + sockExtension, () => {});
					await this.createServer(path);
					// reject(error);
				}
			});

			this.server.listen({ path }, (err) => {
				if (err) reject(err);
				resolve(this.server);
			});
		});
	}

    async serverRoutine (path) {
		await this.createServer(path);
    }

/**************************************************server**************************************************/

/**************************************************client**************************************************/

	async createClientConnection (path) {
		return new Promise((resolve, reject) => {
			this.client = net.createConnection({ path }, (err) => {
				if (err) reject(err);
				// resolve(this.client);
			});

			this.client.on('connect', (err) => {
				if (err) console.error(err);

				resolve(this.client);
			});

			this.client.on('error', error => {
				console.error(error);
	
				setTimeout(async () => {
					this.client.connect(path);
				}, 1000)
			});
			
			this.client.on('end', () => {
				console.log("Client connection ended");
	
				setTimeout(async () => {
					this.client.connect(path);
				}, 1000)
			});

			this.client.on('data', dataPacket => {
				try {
					(this.dataArray = dataPacket.toString().split(';;')).splice(-1);
					this.dataArray.forEach(data => {
						this.clientEvent = JSON.parse(data.toString());
						eventEmitter.emit(this.clientEvent.event, this.clientEvent.payload.toString());
					});
				} catch (e) {
					console.error(e);
				}
			});
		})
	}

    async clientRoutine (path) {
		await this.createClientConnection(path);
    }

/**************************************************client**************************************************/

	receive(event, func) {
		switch (this.role) {
			case 'server':
				eventEmitter.on('c-' + event, func);
				break;
			case 'client':
				eventEmitter.on('s-' + event, func);
				break;
		}
	}

	send(event, payload) {
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

export { Linker };
