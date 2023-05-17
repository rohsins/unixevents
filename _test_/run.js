import { Linker } from '../src/unixevents';
// const Linker = require('../cjs/unixevents');

const main = async () => {
    let producer = new Linker('producer', 'channel1');
    let consumer = new Linker('consumer', 'channel1');

    consumer.receive('hardware', data => {
        console.log("From consumer: ", data);
    });

    setInterval(() => {
        producer.send('hardware', "world");
        // producer.send('hardware', "hello");
    }, 1000);

    // producer.close();
    // consumer.close();
};

main();
