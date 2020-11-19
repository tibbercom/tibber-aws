import AWS from 'aws-sdk';

export const getCurrentEc2InstanceId = () => {

    const meta  = new AWS.MetadataService();
    return new Promise((resolve, reject) => {
        meta.request("/latest/meta-data/instance-id", (err, data) => {
            if(err) reject(err);
            resolve(data);
        });
    });
}

export const getCurrentEc2InstanceNameTag = async () => {

    const instanceId = await getCurrentEc2InstanceId();

    const ec2  = new AWS.EC2();
    var params = {
        Filters : [
            {
                Name: 'resource-id',
                Values: [ instanceId ]
            },
            {
                Name: 'key',
                Values: [ 'Name' ]
            }
        ]
    };
    const nameTag = await ec2.describeTags(params).promise();
    return nameTag.Tags.length && nameTag.Tags[0].Value;
}