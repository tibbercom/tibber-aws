import AWS from 'aws-bluebird';
import {Topic, Queue} from '../src/index';

AWS.config.region = 'eu-west-1';


async function sample() {
    const topic = await Topic.createTopic('test-mig', 'test subject');
    const topic2 = await Topic.createTopic('test-mig2', 'test subject2');
    const queue = await Queue.createQueue('test-mig3');

    console.log(queue);

    await queue.subscribeTopic(topic);
    await queue.subscribeTopic(topic2);

    await topic.push({test:"test"});
    await topic2.push({test:"test"});

    //console.log(topic);

}


sample().then(_ => {

    console.log("Sample done");
    process.exit(0);
}).catch(err =>{

   console.log('ERROR');    
    console.log(err);

}
    );

