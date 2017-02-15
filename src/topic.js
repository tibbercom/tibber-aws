import AWS from 'aws-bluebird';

export class Topic {

    constructor(topicArn, subject, name) {
        this.sns = new AWS.SNS();
        this.topicArn = topicArn;
        this.subject = subject;
        this.name = name;
    }

    static async createTopic(topicName, subjectName) {
        const sns = new AWS.SNS();
        const topicResponse = await sns.createTopic({ Name: topicName });
        return new Topic(topicResponse.TopicArn, subjectName, topicName);
    }

    async push(evt, subject) {

        let message = JSON.stringify(evt);
        let payload = {
            TopicArn: this.topicArn,
            Subject: subject || this.subject,
            Message: JSON.stringify(evt)
        };
        return await this.sns.publish(payload);
    }
}