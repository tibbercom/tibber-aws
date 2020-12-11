import AWS from 'aws-sdk';

export class Topic {
  public sns = new AWS.SNS();

  constructor(
    public topicArn: string,
    public subject: string,
    public name: string
  ) {}

  static async createTopic(topicName: string, subjectName: string) {
    const sns = new AWS.SNS();
    const topicResponse = await sns.createTopic({Name: topicName}).promise();

    if (!topicResponse.TopicArn) {
      throw Error(
        "Unable to get topic ARN... did creating the Topic 'topicName' fail?"
      );
    }

    return new Topic(topicResponse.TopicArn, subjectName, topicName);
  }

  async push(evt: unknown, subject?: string) {
    const payload = {
      Message: JSON.stringify(evt),
      Subject: subject || this.subject,
      TopicArn: this.topicArn,
    };

    return await this.sns.publish(payload).promise();
  }
}
