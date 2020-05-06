import AWS from 'aws-sdk';
import { Topic } from './topic';

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
        this._arnMap = {};
    }

    async subscribeTopic(topic) {

        const self = this;

        if (this._arnMap[topic.topicArn]) {
            return;
        }

        this._arnMap[topic.topicArn] = true;

        const subFunc = async function () {
            const params = {
                Protocol: 'sqs',
                TopicArn: topic.topicArn,
                Endpoint: self.queueArn
            };
            return await self.sns.subscribe(params).promise();
        }

        let response = await this.sqs.getQueueAttributes({
            QueueUrl: this.queueUrl,
            AttributeNames: ['All']
        }).promise();

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
        await this.sqs.setQueueAttributes({ QueueUrl: this.queueUrl, Attributes: { 'Policy': JSON.stringify(policy) } }).promise();
        await subFunc();
    }

    async send(subject, message, delaySeconds = 0) {
        const payload = {
            MessageBody: JSON.stringify({ Subject: subject, Message: JSON.stringify(message) }),
            QueueUrl: this.queueUrl,
            DelaySeconds: delaySeconds
        }
        return await this.sqs.sendMessage(payload).promise();
    }

    static async createQueue(queueName) {
        const sqs = new AWS.SQS();
        const queue = await sqs.createQueue({ QueueName: queueName }).promise();
        const response = await sqs.getQueueAttributes({ QueueUrl: queue.QueueUrl, AttributeNames: ['QueueArn', 'Policy'] }).promise();
        return new Queue(queue.QueueUrl, response.Attributes.QueueArn);
    }
    async receiveMessage(params) {
        params.QueueUrl = this.queueUrl;
        return await this.sqs.receiveMessage(params).promise();
    }

    async deleteMessage(receiptHandle) {
        let props = { QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle };
        const response = await this.sqs.deleteMessage(props).promise();
    }
}

class LoggerWrapper {

    constructor(logger) {
        this._logger = logger || {};
    }

    log(level, message) {
        this._logger.log && this._logger.log(level, message);
    }

    debug(message) {
        this._logger.debug && this._logger.debug(message);
    }

    info(message) {
        this._logger.info && this._logger.info(message);
    }

    error(message) {
        this._logger.error ? this._logger.error(message) : console.log(message);
    }
}

export class QueueSubjectListener {

    constructor(queue, logger, options = { maxConcurrentMessage: 1, waitTimeSeconds: 10, visibilityTimeout: 30 }) {
        this.queue = queue;
        this.defaultParams = {
            MaxNumberOfMessages: options.maxConcurrentMessage,
            WaitTimeSeconds: options.waitTimeSeconds,
            VisibilityTimeout: options.visibilityTimeout,
            receiveTimeout: options.receiveTimeout
        };
        this._logger = new LoggerWrapper(logger);
        this.handlers = {};
    }

    stop() {
        this.isStopped = true;
    }

    onSubject(subjectName, handler) {
        this.handlers[subjectName] = this.handlers[subjectName] || [];
        this.handlers[subjectName].push(handler);
    }

    listen(params) {

        const { MaxNumberOfMessages, WaitTimeSeconds, VisibilityTimeout, receiveTimeout } = Object.assign({}, this.defaultParams, params);
        let self = this;

        let cntInFlight = 0;

        let handlerFunc = async function () {
            try {

                if (this.isStopped === true) return;
                const currentParams = { MaxNumberOfMessages: MaxNumberOfMessages - cntInFlight, WaitTimeSeconds, VisibilityTimeout };

                let response = await self.queue.receiveMessage(currentParams);
                if (!response.Messages || response.Messages.length == 0) {
                    setTimeout(handlerFunc, (receiveTimeout && receiveTimeout()) || 2000);
                    return;
                }
                const messages = response.Messages.map(m => {
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
                });

                cntInFlight += messages.length;

                const promises = messages.map(async m => {

                    try {
                        if (self.handlers[m.message.subject] || self.handlers["*"]) {

                            await Promise.all((self.handlers[m.message.subject] || []).concat(self.handlers["*"] || []).map(async (h) => {
                                try {
                                    await h(m.message.message, m.message.subject);
                                }
                                catch (error) {
                                    self._logger.error(error);
                                }
                            }));
                        }
                        await self.queue.deleteMessage(m.handle);
                        self._logger.debug(`Message with subject "${m.message.subject}" deleted`);
                    }
                    catch (error) {
                        self._logger.error(error);
                    }
                    finally {
                        cntInFlight--;
                    }
                });

                if (MaxNumberOfMessages == cntInFlight) {
                    await Promise.race(promises);
                }
            }
            catch (err) {
                self._logger.error(err);
            }
            setTimeout(handlerFunc, (receiveTimeout && receiveTimeout()) || 10);
        };
        setTimeout(handlerFunc, (receiveTimeout && receiveTimeout()) || 10);
    }
}

export class QueueSubjectListenerBuilder {
    constructor(queueName, logger, ...topics) {
        this.queueName = queueName;
        this.logger = logger;
        this.topics = topics;
    }

    async build() {

        if (!this.queueName)
            throw new Error('"queueName" must be specified');

        let queue = await Queue.createQueue(this.queueName);

        for (let t of this.topics){
            let topic = await Topic.createTopic(t.name, t.subject);
            await queue.subscribeTopic(topic);
        }

        return new QueueSubjectListener(queue, this.logger);

    }
}
