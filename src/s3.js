import AWS from 'aws-sdk';

export class S3Bucket {

    constructor(bucket) {
        this._bucket = bucket;
        this.name = bucket.Name;
        this.creationDate = bucket.CreationDate;
        this._s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    }

    static async getBucket(bucketName) {

        try {
            const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
            let s3bucket = await s3.createBucket({ Bucket: bucketName }).promise();
            return new S3Bucket({ Name: bucketName, CreationDate: Date.now() });
        }
        catch (err) {
            if (err.code === 'BucketAlreadyOwnedByYou') {
                return (await S3Bucket.getBuckets()).filter(b => b.name == bucketName)[0];
            }
            console.log(err);
            throw err;
        }

    }

    static async getBuckets() {
        try {
            const result = await new AWS.S3({ apiVersion: '2006-03-01' }).listBuckets().promise();
            return result.Buckets.map(b => new S3Bucket(b));
        }
        catch (err) {
            return [];
        }
    }

    static async deleteIfExsists(bucketName) {
        try {
            await new AWS.S3({ apiVersion: '2006-03-01' }).deleteBucket({ Bucket: bucketName }).promise();
            return true;
        }
        catch (err) {

            return false;
        }
    }

    async putObject(key, body, contentType) {
        return await this._s3.putObject({ Bucket: this.name, Key: key, Body: body, ContentType: contentType }).promise();
    }

    async getObject(key) {
        return await this._s3.getObject({ Bucket: this.name, Key: key }).promise();
    }

    getObjectAsStream(key) {        
        return this._s3.getObject({ Bucket: this.name, Key: key });
    }

    async getObjectStream(key){
        if (!(await this.objectAvailable(key))){
            throw new Error('Object not available');
        }
        return await this._s3.getObject({ Bucket: this.name, Key: key }).createReadStream();
    }    

    async objectAvailable(key) {
        try {
            const head = await this._s3.headObject({ Bucket: this.name, Key: key }).promise();            
            return true;
        }
        catch (err) {            
            return false;
        }
    }

}