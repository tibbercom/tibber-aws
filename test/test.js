import test from 'ava';
import AWS from 'aws-bluebird';
AWS.config.region = 'eu-west-1';
import {S3Bucket} from '../src/s3';
import {QueueSubjectListenerBuilder} from '../src/queue';


const testBucketName = 'tibber-tibber-ftw-123321';


test.beforeEach(async (t) => {
    await S3Bucket.deleteIfExsists(testBucketName);
});

test('should be able to create bucket', async (t)=>{
    var result = await S3Bucket.getBucket(testBucketName);
    t.is(typeof result, 'object');
});

test('should get bucket if it already exists', async (t)=>{
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
    var buffer = new Buffer([ 8, 6, 7, 5, 3, 0, 9]);
    bucket.putObject('test', buffer);
    t.pass();
});

test('should be able to put object with content type', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([ 8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    t.pass();
});

test('should be able to retrieve object', async (t) => {
    const bucket = await S3Bucket.getBucket(testBucketName);
    var buffer = new Buffer([ 8, 6, 7, 5, 3, 0, 9]);
    await bucket.putObject('test', buffer, 'image/png');
    const result = await bucket.getObject('test');
    t.pass();
});

test('should be able to assign several topics to builder', t=>{

   let builder = new QueueSubjectListenerBuilder('queueName', null, {name:'test', subject: 'test'},{name:'test2', subject: 'test2'})
   t.is(builder.topics.length,2);

});