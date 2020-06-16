import AWS from 'aws-sdk';
const rpc = require('sync-rpc');
let data = undefined;

export const getSecretCollection = function (secretName) {
    if (data) return data;
    try {
        const client = rpc(__dirname + '/syncSecrets.js');
        data = JSON.parse(client({ region: AWS.config.region, secret: secretName }).SecretString);
    }
    catch (err) {
        return undefined;
    }

    return data;
}

export const getSecret = function (secretName, property) {
    const collection = getSecretCollection(secretName);
    return collection ? collection[property] : undefined;
}
