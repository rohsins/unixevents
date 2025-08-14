import { EventEmitter } from 'events';
import net from 'net';
type Role = "server" | "client";
type Channel = string;
declare class Linker extends EventEmitter {
    role?: Role;
    channel?: Channel;
    server?: net.Server;
    serverClient?: net.Socket;
    dataArray?: Array<string>;
    serverEvent?: {
        event: string;
        payload: Object | string;
    };
    client?: net.Socket;
    clientEvent?: {
        event: string;
        payload: Object | string;
    };
    emitData?: string;
    handle?: net.Socket | undefined;
    debug: Boolean;
    consoleLog(...args: any): void;
    consoleError(...args: any): void;
    enableDebug(): void;
    disableDebug(): void;
    constructor(role: Role, channel: Channel);
    init(role: Role, channel: Channel): Promise<boolean>;
    createServer(path: string): Promise<unknown>;
    serverRoutine(path: string): Promise<boolean>;
    createClientConnection(path: string): Promise<unknown>;
    clientRoutine(path: string): Promise<boolean>;
    receive(event: string, func: any): void;
    receiveOnce(event: string, func: any): void;
    removeReceiver(event: string, func: any): void;
    send(event: string, payload: object | string, callback: Function | undefined): void;
    sendSync(event: string, payload: object | string): Promise<Error | null | undefined | boolean>;
    close(): void;
}
export default Linker;
