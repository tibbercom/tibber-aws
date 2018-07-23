import AWS from 'aws-sdk';
const rpc = require('sync-rpc');
let data = undefined;

export const getSecret = function (collection, property) {
    if (data) return data[property];
    const client = rpc(__dirname + '/syncSecrets.js');
    data = JSON.parse(client({ region: AWS.config.region, secret: collection }).SecretString);
    return data ? data[property] : undefined;
}