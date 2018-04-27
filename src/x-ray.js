try {
    const path = require('path');
    const fs = require('fs');    
    const file = path.join(__dirname, '..', 'aws-xray-sdk-core', 'lib', 'context_utils.js');
    let txt = fs.readFileSync(file, 'utf8');
    txt = txt.replace("require('continuation-local-storage')", "require('cls-hooked')");

    fs.writeFileSync(file, txt, 'utf8');
}
catch(error){
    console.error('error while monkey patching x-ray-stuff');
}


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
}

export const xRayOpenExpressMiddleware = (appName) => {
    const contatinerMetadata = getContainterMetadataSync();
    const segmentName = `${appName}@${contatinerMetadata ? contatinerMetadata.ContainerID.substring(0, 12) : os.hostname()}`;
    const middleware = AWSXRay.express.openSegment(segmentName);
    AWSXRay.middleware.setSamplingRules(configuredSamplingRules);

    return middleware;
}

export const xRayCloseExpressMiddleware = () => AWSXRay.express.closeSegment();

export const xRayIsInitialized = () => xRayInitialized;