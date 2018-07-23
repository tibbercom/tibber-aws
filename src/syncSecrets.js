var AWS = require('aws-sdk');

function init() {
    return function (request) {        
        AWS.config.region = request.region;
        const client = new AWS.SecretsManager();
        return client.getSecretValue({ SecretId: request.secret }).promise();
    }
}
module.exports = init;