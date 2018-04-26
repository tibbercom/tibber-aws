import AWS from 'aws-sdk';
import AWSXRay from 'aws-xray-sdk';
import { getContainterMetadataSync } from './container-info';
import os from 'os';

let xRayInitialized = false;

export const xRayInitialize = ({ samplingRules, deamonAddress }) => {
    AWSXRay.captureAWS(AWS);
    AWSXRay.middleware.setSamplingRules(samplingRules);
    AWSXRay.setDaemonAddress(deamonAddress);    

    if (process.env.ECS_CONTAINER_METADATA_FILE) {
        AWSXRay.config([AWSXRay.plugins.ECSPlugin]);
    }
    xRayInitialized = true;
}

export const xRayOpenExpressMiddleware = (appName) => {
    const contatinerMetadata = getContainterMetadataSync();
    const segmentName = `${appName}@${contatinerMetadata ? contatinerMetadata.ContainerID.substring(0, 12) : os.hostname()}`;
    return AWSXRay.express.openSegment(segmentName);
}

export const xRayCloseExpressMiddleware = () => AWSXRay.express.closeSegment();

export const xRayIsInitialized = () => xRayInitialized;