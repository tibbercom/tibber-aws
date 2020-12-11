import AWS from 'aws-sdk';
const rpc = require('sync-rpc');
import {SyncSecretsResolved} from './types';
const cache: Record<string, unknown> = {};

export const getSecretCollection = function (secretName: string) {
  if (cache[secretName]) return cache[secretName];
  try {
    const client: SyncSecretsResolved = rpc(__dirname + '/syncSecrets.js');
    const secretString = client({region: AWS.config.region, secret: secretName})
      .SecretString;

    if (!secretString)
      throw Error("Property 'SecretString' on client response was undefined.");

    const data = JSON.parse(secretString);
    cache[secretName] = data;

    return data;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};
