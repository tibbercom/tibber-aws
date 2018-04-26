import fs from 'fs';

export const getContainterMetadata = async () => {
    if (!process.env.ECS_CONTAINER_METADATA_FILE) return undefined;

    return new Promise((resolve, reject) => fs.readFile(process.env.ECS_CONTAINER_METADATA_FILE, 'utf8', (err, data) =>
        err ? reject(err) : resolve(JSON.parse(data))));
}

export const getContainterMetadataSync = async () => {
    if (!process.env.ECS_CONTAINER_METADATA_FILE) return undefined;
    return JSON.parse(fs.readFileSync(process.env.ECS_CONTAINER_METADATA_FILE, 'utf8'));
}