import AWS from 'aws-bluebird';
import {Topic} from './topic';

let policyTemplate = {
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "Sid" + new Date().getTime(),
        "Effect": "Allow",
        "Principal": {
            "AWS": "*"
        },
        "Action": ["sqs:SendMessage", "sqs:ReceiveMessage"]
    }
    ]
};



export class Queue {

    constructor(queueUrl, queueArn) {
        this.queueUrl = queueUrl;
        this.queueArn = queueArn;
        this.sqs = new AWS.SQS();
        this.sns = new AWS.SNS();
    }

    async subscribeTopic(topic) {

        const self = this;
        const subFunc = async function () {
            const params = {
                Protocol: 'sqs',
                TopicArn: topic.topicArn,
                Endpoint: self.queueArn
            };
            return await self.sns.subscribe(params);
        }

        let response = await this.sqs.getQueueAttributes({
            QueueUrl: this.queueUrl,
            AttributeNames: ['All']
        });

        let policy = policyTemplate;

        if (response.Attributes.Policy) {
            policy = JSON.parse(response.Attributes.Policy);
        }

        let statement = policy.Statement[0];

        statement.Resource = statement.Resource || this.queueArn;
        statement.Condition = statement.Condition || {};
        statement.Condition.ArnLike = statement.Condition.ArnLike || {}
        statement.Condition.ArnLike["aws:SourceArn"] = statement.Condition.ArnLike["aws:SourceArn"] || [];

        let sourceArns = statement.Condition.ArnLike["aws:SourceArn"];

        if (!(sourceArns instanceof Array)) {
            sourceArns = [sourceArns];
            statement.Condition.ArnLike["aws:SourceArn"] = sourceArns;
        }

        if (sourceArns.filter(a => a === topic.topicArn).length > 0) {
            await subFunc();
            return;
        }
        sourceArns.push(topic.topicArn);
        await this.sqs.setQueueAttributes({ QueueUrl: this.queueUrl, Attributes: { 'Policy': JSON.stringify(policy) } });

        await subFunc();

    }

    static async createQueue(queueName) {
        const sqs = new AWS.SQS();
        const queue = await sqs.createQueue({ QueueName: queueName });
        const response = await sqs.getQueueAttributes({ QueueUrl: queue.QueueUrl, AttributeNames: ['QueueArn', 'Policy'] });
        return new Queue(queue.QueueUrl, response.Attributes.QueueArn);

    }
    async receiveMessage(params) {
        params.QueueUrl = this.queueUrl;
        return await this.sqs.receiveMessage(params);
    }

    async deleteMessage(receiptHandle) {
        let props = { QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle };
        const response = await this.sqs.deleteMessage(props);
    }
}

class LoggerWrapper {

    constructor(logger) {
        this._logger = logger || {};
    }

    log(message) {
        this._logger.log ? this._logger.log(message) : console.log(message);
    }

    info(message) {
        this._logger.info ? this._logger.info(message) : console.log(message);
    }

    error(message) {
        this._logger.error ? this._logger.error(message) : console.log(message);
    }
}

export class QueueSubjectListener {

    constructor(queue, logger) {
        this.queue = queue;
        this.defaultParams = {
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10
        };
        this._logger = new LoggerWrapper(logger);

    }

    onSubject(subjectName, handler) {

        this.handlers = this.handlers || {};
        this.handlers[subjectName] = this.handlers[subjectName] || [];
        this.handlers[subjectName].push(handler);
    }

    listen(params) {

        params = params || this.defaultParams;

        let self = this;

        let handlerFunc = async function () {
            try {

                let response = await self.queue.receiveMessage(params);
                if (!response.Messages || response.Messages.length == 0) {
                    setTimeout(handlerFunc, 2000);
                    return;
                }
                await Promise.all(response.Messages.map(m => {
                    let json = JSON.parse(m.Body);

                    try {
                        return {
                            handle: m.ReceiptHandle,
                            message: {
                                subject: json.Subject,
                                message: JSON.parse(json.Message)
                            }
                        }
                    }
                    catch (error) {
                        self._logger.error('Not able to parse event as json');
                        return { handle: m.ReceiptHandle, message: { subject: "Delete Me" } }
                    }
                }).map(async (m) => {

                    if (self.handlers[m.message.subject] || self.handlers["*"]) {

                        await Promise.all((self.handlers[m.message.subject] || []).concat(self.handlers["*"] || []).map(async (h) => {
                            try {
                                await h(m.message.message, m.message.subject);
                            }
                            catch (error) {
                                self._logger.log(error);
                            }
                        }));
                    }
                    await self.queue.deleteMessage(m.handle);
                    self._logger.info('Message deleted');

                }));
            }
            catch (err) {
                self._logger.error(err);
            }
            setTimeout(handlerFunc, 100);
        };
        setTimeout(handlerFunc, 10);
    }

}

export class QueueSubjectListenerBuilder {

    constructor(queueName,logger, ...topics){
        this.queueName = queueName;
        this.logger = logger;
        this.topics = topics;
    }

    async build() {

        if (!this.queueName)
            throw new Error('"queueName" must be specified');

        let queue = await Queue.createQueue(this.queueName);

        await Promise.all(this.topicInfo.map(async (t) => {
            let topic = await Topic.createTopic(t.name, t.subject);
            await queue.subscribeTopic(topic);
        }));

        return new QueueSubjectListener(queue, this.logger);

    }
}
