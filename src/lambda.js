import AWS from 'aws-sdk';

export const getLambdaFunc = (funcName) => {
    const lambda = new AWS.Lambda();
    return async (payload) => {
        const result = await lambda.invoke({ FunctionName: funcName, Payload: JSON.stringify(payload) }).promise();
        return result.Payload ? JSON.parse(result.Payload) : null;
    };
}

