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
						_fs2.default.stat(path, (err, stats) => {
									if (err) {
												this.createServer(path).listen(path);
												return;
									}
									_fs2.default.unlink(path, err => {
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
						this.server = _net2.default.createServer(client => {
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
						this.handleClient(this.client, path);
						return this.client;
			}

			handleClient(client, path) {
						client.on('data', data => {
									try {
												this.clientEvent = JSON.parse(data.toString());
												if (/^[\],:{}\s]*$/.test(this.clientEvent.payload.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
															eventEmitterDefault.emit(this.clientEvent.event, JSON.stringify(this.clientEvent.payload));
												} else {
															eventEmitterDefault.emit(this.clientEvent.event, this.clientEvent.payload.toString());
												}
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

exports.EventEmitter = EventEmitter;