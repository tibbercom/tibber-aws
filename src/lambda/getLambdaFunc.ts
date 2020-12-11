import AWS from 'aws-sdk';

type GetLambdaFunc = {
  <TResult>(funcName: string): {
    <TRequest>(payload: TRequest): Promise<TResult>;
  };
};

export const getLambdaFunc: GetLambdaFunc = funcName => {
  const lambda = new AWS.Lambda();
  return async payload => {
    const result = await lambda
      .invoke({FunctionName: funcName, Payload: JSON.stringify(payload)})
      .promise();

    if (typeof result.Payload !== 'string') {
      throw Error(
        'lambda result was not a string. Only string results are currently supported.'
      );
    }

    return result.Payload ? JSON.parse(JSON.parse(result.Payload)) : null;
  };
};
