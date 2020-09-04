import AWS from 'aws-sdk';
const rpc = require('sync-rpc');
let cache = {};

export const getSecretCollection = function (secretName) {
    if (cache[secretName]) return cache[secretName];
    try {
        const client = rpc(__dirname + '/syncSecrets.js');
        const data = JSON.parse(client({ region: AWS.config.region, secret: secretName }).SecretString);
        cache[secretName] = data;
        return data;
    }
    catch (err) {
        return undefined;
    }
}

export const getSecret = function (secretName, property) {
    const collection = getSecretCollection(secretName);
    return collection ? collection[property] : undefined;
}
