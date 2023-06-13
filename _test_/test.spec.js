import Linker from '../';

describe('Testing linker events', async () => {
    let mqttService = new Linker('server', 'channel1');
    let updateService = new Linker('client', 'channel1');
    
    it('testing unix connection', async () => {
        updateService.receive('hardware', data => {
            console.log("Message on UpdateService: ", data);
        });

        mqttService.receive('hardware', data => {
            console.log("Message on MqttService: ", data);
        });

        mqttService.send('hardware', "hello from mqtt service");
        updateService.send('hardware', "hello from update service");
    });

    it ('closing connection', async () => {
        mqttService.close();
        updateService.close();
    });
});
