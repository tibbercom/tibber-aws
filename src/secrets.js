import AWS from 'aws-sdk';

let data = null

export const getSecret = async (collection, property) => {

    try {
        const client = new AWS.SecretsManager();
        data = data || JSON.parse(((await client.getSecretValue({ SecretId: collection }).promise()).SecretString));
        return data[property];
    }
    catch (err) {
        console.error(err);
    }

}