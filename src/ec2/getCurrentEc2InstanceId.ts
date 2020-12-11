import AWS from 'aws-sdk';

export const getCurrentEc2InstanceId = (): Promise<string> => {
  const meta = new AWS.MetadataService();
  return new Promise((resolve, reject) => {
    meta.request('/latest/meta-data/instance-id', (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};
