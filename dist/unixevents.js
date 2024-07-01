"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const net_1 = __importDefault(require("net"));
const fs_1 = __importDefault(require("fs"));
const eventEmitter = new events_1.EventEmitter();
const parentPath = process.platform === "linux" ? '/tmp/' : ("\\\\.\\pipe\\" + process.env['TMP'] + "\\");
const sockExtension = '.sock';
class Linker extends events_1.EventEmitter {
    consoleLog(...args) {
        if (this.debug)
            console.log(args);
    }
    consoleError(...args) {
        if (this.debug)
            console.error(args);
    }
    enableDebug() {
        this.debug = true;
    }
    disableDebug() {
        this.debug = false;
    }
    constructor(role, channel) {
        super();
        this.debug = false;
        this.removeReceiver = eventEmitter.removeListener;
        this.removeAllReceiver = eventEmitter.removeAllListeners;
        if (role && channel)
            this.init(role, channel);
    }
    init(role, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.role = role;
            this.channel = channel;
            switch (this.role) {
                case 'server':
                    return yield this.serverRoutine(parentPath + this.channel + sockExtension);
                case 'client':
                    return yield this.clientRoutine(parentPath + this.channel + sockExtension);
                default:
                    throw new Error('Error: no role specified');
            }
        });
    }
    createServer(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (fs_1.default.existsSync(path))
                    fs_1.default.unlink(path, () => { });
                this.server = net_1.default.createServer(client => {
                    this.serverClient = client;
                    this.serverClient.on('data', dataPacket => {
                        try {
                            (this.dataArray = dataPacket.toString().split(';;')).splice(-1);
                            this.dataArray.forEach(data => {
                                this.serverEvent = JSON.parse(data.toString());
                                eventEmitter.emit(this.serverEvent.event, this.serverEvent.payload.toString());
                            });
                        }
                        catch (e) {
                            this.consoleError(e);
                        }
                    });
                });
                this.server.on('error', (error) => __awaiter(this, void 0, void 0, function* () {
                    if (error.code === 'EADDRINUSE') {
                        fs_1.default.unlink(path, () => { });
                        reject(error);
                    }
                }));
                this.server.listen({ path }, () => {
                    resolve(this.server);
                });
            });
        });
    }
    serverRoutine(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let retry = 10;
            while (!(yield this.createServer(path).then(_ => true).catch(_ => false))) {
                retry--;
                if (!retry)
                    return false;
            }
            return true;
        });
    }
    createClientConnection(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, _reject) => {
                this.client = net_1.default.createConnection({ path }, () => {
                });
                this.client.on('connect', (err) => {
                    if (err)
                        this.consoleError(err);
                    resolve(this.client);
                });
                this.client.on('error', _error => {
                    this.consoleError(_error);
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        this.client.connect(path);
                    }), 1000);
                });
                this.client.on('end', () => {
                    this.consoleLog("Client connection ended");
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        this.client.connect(path);
                    }), 1000);
                });
                this.client.on('data', dataPacket => {
                    try {
                        (this.dataArray = dataPacket.toString().split(';;')).splice(-1);
                        this.dataArray.forEach(data => {
                            this.clientEvent = JSON.parse(data.toString());
                            eventEmitter.emit(this.clientEvent.event, this.clientEvent.payload.toString());
                        });
                    }
                    catch (e) {
                        this.consoleError(e);
                    }
                });
            });
        });
    }
    clientRoutine(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.createClientConnection(path).then(_ => true).catch(_ => false);
        });
    }
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
    receiveOnce(event, func) {
        switch (this.role) {
            case 'server':
                eventEmitter.once('c-' + event, func);
                break;
            case 'client':
                eventEmitter.once('s-' + event, func);
                break;
        }
    }
    send(event, payload) {
        event = this.role === 'server' ? 's-' + event : 'c-' + event;
        payload = typeof (payload) === 'object' ? JSON.stringify(payload) : payload;
        this.emitData = JSON.stringify({ event, payload });
        this.handle = this.role === 'server' ? this.serverClient : this.client;
        if (this.handle)
            this.handle.write(this.emitData + ';;');
        else
            this.consoleError("Handle is null: ", this.handle);
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
exports.default = Linker;
