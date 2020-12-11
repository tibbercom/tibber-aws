import AWS from 'aws-sdk';
import {SyncSecretsInit} from './types';

const init: SyncSecretsInit = () => {
  return request => {
    AWS.config.region = request.region;
    const client = new AWS.SecretsManager();
    return client.getSecretValue({SecretId: request.secret}).promise();
  };
};

// noinspection JSUnusedGlobalSymbols
/**
 * This file is executed out-of-proc by sync-rpc in 'getSecretCollection.ts'.
 * The default export is important, and should not be removed;
 */
export default init;
