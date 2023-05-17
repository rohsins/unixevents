import { Linker } from '../src/unixevents';

describe('Testing linker events', async () => {
    let server = new Linker('server', 'channel1');
    let client = new Linker('client', 'channel1');

    
    it('testing unix connection', async () => {
        // await server.init();
        // await client.init();

        client.receive('hardware', data => {
            console.log("Message on client: ", data);
        });
        server.receive('hardware', data => {
            console.log("Message on server: ", data);
        });

        server.send('hardware', "hello");
        setTimeout(() => {
            server.send('hardware', "world");
            client.send('hardware', "what");
        }, 10);
    });

    setTimeout(() => {
        it ('closing connection', async () => {
            server.close();
            client.close();
        });
    }, 2000);
});
