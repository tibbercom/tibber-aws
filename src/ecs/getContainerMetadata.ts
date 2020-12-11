import fs from 'fs';

export const getContainerMetadata = async () => {
  if (!process.env.ECS_CONTAINER_METADATA_FILE) return undefined;

  const metadataFile = process.env.ECS_CONTAINER_METADATA_FILE;

  return new Promise((resolve, reject) =>
    fs.readFile(metadataFile, 'utf8', (err, data) =>
      err ? reject(err) : resolve(JSON.parse(data))
    )
  );
};
