import AWS from 'aws-sdk';
import {Queue, Topic} from '../src/index';

AWS.config.region = 'eu-west-1';

async function sample() {
  //create (or get) topics
  const topic = await Topic.createTopic('test-', 'test subject');
  const topic2 = await Topic.createTopic('test-mig2', 'test subject2');

  //create (or get) queue
  const queue = await Queue.createQueue('test-mig3');

  //subscribe queue to topics
  await queue.subscribeTopic(topic);
  await queue.subscribeTopic(topic2);

  //push json event to queue
  await topic.push({test: 'test'});
  await topic2.push({test: 'test'});
}

sample()
  .then(_ => {
    console.log('Sample done');
    // process.exit(0); or
    // throw Error('Early exit')
  })
  .catch(err => {
    console.log('ERROR');
    console.log(err);
  });
