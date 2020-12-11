import {SecretsManager} from 'aws-sdk';
import {AWSError} from 'aws-sdk/lib/error';
import {PromiseResult} from 'aws-sdk/lib/request';

export type SyncSecretsRequest = {
  region: undefined | string;
  secret: string;
};

export type SyncSecretsInit = {
  (): (
    request: SyncSecretsRequest
  ) => Promise<
    PromiseResult<SecretsManager.Types.GetSecretValueResponse, AWSError>
  >;
};

export type SyncSecretsResolved = {
  (request: SyncSecretsRequest): PromiseResult<
    SecretsManager.Types.GetSecretValueResponse,
    AWSError
  >;
};
