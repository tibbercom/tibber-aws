import AWS from 'aws-sdk';
import {DescribeTagsRequest} from 'aws-sdk/clients/ec2';
import {getCurrentEc2InstanceId} from './getCurrentEc2InstanceId';

export const getCurrentEc2InstanceNameTag = async () => {
  const instanceId = await getCurrentEc2InstanceId();

  const ec2 = new AWS.EC2();
  const params: DescribeTagsRequest = {
    Filters: [
      {
        Name: 'resource-id',
        Values: [instanceId],
      },
      {
        Name: 'key',
        Values: ['Name'],
      },
    ],
  };
  const nameTag = await ec2.describeTags(params).promise();
  return nameTag.Tags?.length && nameTag.Tags[0].Value;
};
