import {getSecretCollection} from './getSecretCollection';

export const getSecret = function (
  secretName: string,
  property: string
): string | undefined {
  const collection = getSecretCollection(secretName);
  return collection ? collection[property] : undefined;
};
