import test from 'ava';
import AWS from 'aws-bluebird';
AWS.config.region = 'eu-west-1';
import { S3Bucket } from '../src/s3';
import { QueueSubjectListenerBuilder, Queue } from '../src/queue';
import rand from 'randomstring';
import { Readable } from 'stream';


const testBucketName = 'tibber-tibber-ftw-123321';


test.beforeEach(async (t) => {
    await S3Bucket.deleteIfExsists(testBucketName);
});

test('should be able to create bucket', async (t) => {
    var result = await S3Bucket.getBucket(testBucketName);
    t.is(typeof result, 'object');
});

test('should get bucket if it already exists', async (t) => {
    var result = await S3Bucket.getBucket(testBucketName);
    var result2 = await S3Bucket.getBucket(testBucketName);
    t.is(result.name, result2.name);
});

test('getBuckets should return array', async (t) => {
    const result = await S3Bucket.getBuckets();
    t.true(Array.isArray(result));
});

test('should be able to put object without content type', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);
    bucket.putObject('test', buffer);
    t.pass();
});

test('should be able to put object with content type', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    t.pass();
});

test('should be able to retrieve object', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    const result = await bucket.getObject('test');
    t.pass();
});

test('should be able to retrieve object as stream', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    const result = bucket.getObjectAsStream('test');
    t.truthy(result.createReadStream);
});

test('should be able to retrieve object as stream 2', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    const result = await bucket.getObjectStream('test');
    t.true(result instanceof Readable);
});

test('should be able to handle missing key exception', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    let name = rand.generate();
    
    try {
        const result = await bucket.getObjectStream(name);
    }
    catch (error) {
        t.is(error.message,'Object not available');        
    }
});

test('should be able to assign several topics to builder', (t) => {
    let builder = new QueueSubjectListenerBuilder('test-queueName', null, { name: 'test', subject: 'test' }, { name: 'test2', subject: 'test2' })
    t.is(builder.topics.length, 2);
});

test('should be able to check wheter object is available in S3', async t => {

    const bucket = await S3Bucket.getBucket(testBucketName);
    let buffer = new Buffer([8, 6, 7, 5, 3, 0, 9]);

    let name = rand.generate();

    await bucket.putObject(name, buffer, 'image/png');
    let result = await bucket.objectAvailable(name);
    t.true(result);

    name = rand.generate();

    result = await bucket.objectAvailable(name);
    t.false(result);
});

/*
test.only('should be able to send message to queue', async t => {

    const queue = await Queue.createQueue('test-tibber-aws-queue');
    console.log(await queue.send('Test', { property: 'test' }));
});

test.only('should be able to assign several topics to builder', async (t) =>{
   
   try{
       let result = await Promise.all([new Promise((resolve,reject)=> reject('Go fuck yourself')),new Promise((resolve,reject)=>{console.log('ran');resolve("sweet");})]);       
       console.log(result);
   }
   catch(err){
       console.log(err);
   }

});*/