import AWS from 'aws-bluebird';

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