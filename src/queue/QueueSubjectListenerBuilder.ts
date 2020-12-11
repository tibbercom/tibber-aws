import {ILogger} from '../ILogger';
import {Queue} from './Queue';
import {QueueSubjectListener} from './QueueSubjectListener';
import {Topic} from './Topic';

interface ITopic {
  name: string;
  subject: string;
}

export class QueueSubjectListenerBuilder {
  public topics: Array<ITopic>;

  constructor(
    public queueName: string,
    public logger?: ILogger | undefined | null,
    ...topics: Array<ITopic>
  ) {
    this.topics = topics;
  }

  async build() {
    if (!this.queueName) throw new Error('"queueName" must be specified');

    const queue = await Queue.createQueue(this.queueName);

    for (const t of this.topics) {
      const topic = await Topic.createTopic(t.name, t.subject);
      await queue.subscribeTopic(topic);
    }

    return new QueueSubjectListener(queue, this.logger);
  }
}
