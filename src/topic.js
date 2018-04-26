import AWS from 'aws-sdk';

export class Topic {

    constructor(topicArn, subject, name) {
        this.sns = new AWS.SNS();
        this.topicArn = topicArn;
        this.subject = subject;
        this.name = name;
    }

    static async createTopic(topicName, subjectName) {
        const sns = new AWS.SNS();
        const topicResponse = await sns.createTopic({ Name: topicName }).promise();
        return new Topic(topicResponse.TopicArn, subjectName, topicName);
    }

    async push(evt, subject) {
        let payload = {
            TopicArn: this.topicArn,
            Subject: subject || this.subject,
            Message: JSON.stringify(evt)
        };
        return await this.sns.publish(payload).promise();
    }
}