# tibber-aws

```javascript
import {Topic, Queue} from 'tibber-aws';

const topic = await Topic.createTopic('test-', 'test subject');
const topic2 = await Topic.createTopic('test-mig2', 'test subject2');

//create (or get) queue
const queue = await Queue.createQueue('test-mig3');

//subscribe queue to topics
await queue.subscribeTopic(topic);
await queue.subscribeTopic(topic2);

//push json event to queue  
await topic.push({ test: "test" });
await topic2.push({ test: "test" });
```
