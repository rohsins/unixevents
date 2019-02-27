'use strict';

Object.defineProperty(exports, "__esModule", {
			value: true
});
exports.EventEmitter = undefined;

var _events = require('events');

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const eventEmitterDefault = new _events.EventEmitter();
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
						_fs2.default.stat(path, (err, stats) => {
									if (err) {
												this.createServer().listen(path);
												return;
									}
									_fs2.default.unlink(path, err => {
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
						this.server = _net2.default.createServer(client => {
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
									this.client = _net2.default.createConnection({ path });
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

exports.EventEmitter = EventEmitter;