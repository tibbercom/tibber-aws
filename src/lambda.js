import AWS from 'aws-sdk';

export const getLambdaFunc = (funcName) => {
    const lambda = new AWS.Lambda();
    return (payload) => lambda.invoke({ FunctionName: funcName, Payload: JSON.stringify(payload) }).promise();
}

