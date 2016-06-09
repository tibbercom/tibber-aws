import AWS from 'aws-bluebird';

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

export class Topic {

    constructor(topicArn, subject) {
        this.sns = new AWS.SNS();
        this.topicArn = topicArn;
        this.subject = subject
    }

    static async createTopic(topicName, subjectName) {
        const sns = new AWS.SNS();
        const topicResponse = await sns.createTopic({ Name: topicName });
        return new Topic(topicResponse.TopicArn, subjectName);
    }

    async push(evt) {

        let message = JSON.stringify(evt);
        let payload = {
            TopicArn: this.topicArn,
            Subject: this.subject,
            Message: JSON.stringify(evt)
        };
        return await this.sns.publish(payload);
    }
}

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

        if (!statement.Condition) {
            statement.Condition = {};
        }

        if (!statement.Condition.ArnLike) {
            statement.Condition.ArnLike = {};
        }

        if (!statement.Condition.ArnLike["aws:SourceArn"]) {
            statement.Condition.ArnLike["aws:SourceArn"] = []
        }
               

        let sourceArns = statement.Condition.ArnLike["aws:SourceArn"];

        if (!(sourceArns instanceof Array)){
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
        console.log('Message deleted');
    }
}

export class QueueSubjectListener {

    constructor(queue) {
        this.queue = queue;
        this.defaultParams = {
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10
        };
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
                    return {
                        handle: m.ReceiptHandle,
                        message: {
                            subject: json.Subject,
                            message: JSON.parse(json.Message)
                        }
                    }
                }).map(async (m) => {

                    if (self.handlers[m.message.subject]) {

                        self.handlers[m.message.subject].forEach(async (h) => {
                            await h(m.message.message);
                        });
                    }
                    await self.queue.deleteMessage(m.handle);

                }));
            }
            catch (err) {
                console.log(err);
            }
            setTimeout(handlerFunc, 100);
        };
        setTimeout(handlerFunc, 10);
    }

}