import test from 'ava';
import rand from 'randomstring';
import {Readable} from 'stream';
import {
  Queue,
  QueueSubjectListenerBuilder,
  S3Bucket,
  configure,
  getLambdaFunc,
  getSecret,
} from '../src/index';

configure({region: 'eu-west-1'});

const testBucketName = 'tibber-tibber-ftw-123321';

test.beforeEach(async t => {
  await S3Bucket.deleteIfExsists(testBucketName);
});

test('should be able to create bucket', async t => {
  const result = await S3Bucket.getBucket(testBucketName);
  t.is(typeof result, 'object');
});

test('should get bucket if it already exists', async t => {
  const result = await S3Bucket.getBucket(testBucketName);
  const result2 = await S3Bucket.getBucket(testBucketName);
  t.is(result.name, result2.name);
});

test('getBuckets should return array', async t => {
  const result = await S3Bucket.getBuckets();
  t.true(Array.isArray(result));
});

test('should be able to put object without content type', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
  bucket.putObject('test', buffer);
  t.pass();
});

test('should be able to put object with content type', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
  await bucket.putObject('test', buffer, 'image/png');
  t.pass();
});

test('should be able to retrieve object', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
  await bucket.putObject('test', buffer, 'image/png');
  const result = await bucket.getObject('test');
  t.pass();
});

test('should be able to retrieve object as stream', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
  await bucket.putObject('test', buffer, 'image/png');
  const result = bucket.getObjectAsStream('test');
  t.truthy(result.createReadStream);
});

test('should be able to retrieve object as stream 2', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
  await bucket.putObject('test', buffer, 'image/png');
  const result = await bucket.getObjectStream('test');
  t.true(result instanceof Readable);
});

test('should be able to handle missing key exception', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const name = rand.generate();

  try {
    const result = await bucket.getObjectStream(name);
  } catch (error) {
    t.is(error.message, 'Object not available');
  }
});

test('should be able to assign several topics to builder', t => {
  const builder = new QueueSubjectListenerBuilder(
    'test-queueName',
    null,
    {name: 'test', subject: 'test'},
    {name: 'test2', subject: 'test2'}
  );
  t.is(builder.topics.length, 2);
});

test('should be able to check wheter object is available in S3', async t => {
  const bucket = await S3Bucket.getBucket(testBucketName);
  const buffer = Buffer.from([8, 6, 7, 5, 3, 0, 9]);

  let name = rand.generate();

  await bucket.putObject(name, buffer, 'image/png');
  let result = await bucket.objectAvailable(name);
  t.true(result);

  name = rand.generate();

  result = await bucket.objectAvailable(name);
  t.false(result);
});

/*
test.only('run lambda func', async t => {

    configure({ region: 'eu-west-1' });
    /* const func = getLambdaFunc('pyml_fit_forecast_model_single_home');

    await func({ homeId: 'bc4cf5b9-4f35-4ce3-83ad-dfe6906e97ba' });

    const lambda = getLambdaFunc('pyml_predict_forecast_single_home');
    const startTime = moment.tz('Europe/Oslo').startOf('day').add(1, 'day');
    const endTime = moment.tz('Europe/Oslo').startOf('day').add(2, 'day');
    const modelType = 'consumption';
    const result = await lambda({ homeId: '14b024f9-1c7f-4b2f-9fc6-6e2b3921d201', startTime, endTime, modelType });

    console.log(result);
});




test.only('getSecret', t=>{

   console.log(getSecret('asdfa', 'connectionStringNodeJs'));

})


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

}); */
