import fs from 'fs';

export const getContainerMetadataSync = () => {
  if (!process.env.ECS_CONTAINER_METADATA_FILE) return undefined;
  return JSON.parse(
    fs.readFileSync(process.env.ECS_CONTAINER_METADATA_FILE, 'utf8')
  );
};
