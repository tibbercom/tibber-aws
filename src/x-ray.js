import AWS from 'aws-sdk';
import AWSXRay from 'aws-xray-sdk';
import { getContainterMetadataSync } from './container-info';
import os from 'os';
import http from 'http';

let xRayInitialized = false;
let configuredSamplingRules = null;

export const xRayInitialize = ({ samplingRules, deamonAddress }) => {

    if (xRayInitialized) throw Error('Already initialized');

    configuredSamplingRules = samplingRules;

    AWSXRay.setDaemonAddress(deamonAddress);
    AWSXRay.captureHTTPsGlobal(http);
    AWSXRay.captureAWS(AWS);    

    if (process.env.ECS_CONTAINER_METADATA_FILE) {
        AWSXRay.config([AWSXRay.plugins.ECSPlugin]);
    }
    xRayInitialized = true;

    console.log('init done');
}

export const xRayOpenExpressMiddleware = (appName) => {
    const contatinerMetadata = getContainterMetadataSync();
    const segmentName = `${appName}@${contatinerMetadata ? contatinerMetadata.ContainerID.substring(0, 12) : os.hostname()}`;
    const middleware = AWSXRay.express.openSegment(segmentName);
    AWSXRay.middleware.setSamplingRules(configuredSamplingRules);
    console.log('sampling rules set', configuredSamplingRules);
    return middleware;
}

export const xRayCloseExpressMiddleware = () => AWSXRay.express.closeSegment();

export const xRayIsInitialized = () => xRayInitialized;