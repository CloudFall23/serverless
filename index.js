const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const https = require('https');
//const ses = new AWS.SES();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API, 
    //'77a86bf3290ad11535b7e314d9eeec8f-5d2b1caa-3b57900a',
    domain: 'demos.siddharthgargava.me'
  });

exports.handler = async (event, context) => {
    try {
      const fetch = await import('node-fetch'); // Dynamic import for node-fetch
   
      console.log(event);
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      console.log(snsMessage);
      const fileUrl = snsMessage.submissionUrl;
      console.log(fileUrl);

      const googleStorageBucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME;
      const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      const googleServiceEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
      const dynamoTableName = process.env.DYNAMO_TABLE_NAME;
      console.log(googleStorageBucketName);
      console.log(googleServiceAccountKey);
      console.log(googleServiceEmail);
      console.log(dynamoTableName);

      const decodedPrivateKey = Buffer.from(googleServiceAccountKey, 'base64').toString('utf-8');
      const keyFileJson = JSON.parse(decodedPrivateKey);
      console.log(keyFileJson);
      console.log(keyFileJson.private_key);
   
      //const { Storage } = require('@google-cloud/storage');
      const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: keyFileJson
        });

        //Could change
   
      const fileData = await downloadFile(fetch.default, fileUrl);
      const bucketName = googleStorageBucketName;
      const fileName = 'test.zip';//ask about this
   
      // const s3 = new AWS.S3();
      // const s3Params = {
      //   Bucket: bucketName,
      //   Key: fileName,
      //   Body: fileData,
      //   ACL: 'private'
      // };

      console.log("Uploading file to Google Cloud Storage");
      await uploadToGCS(storage, googleStorageBucketName, fileName, fileData);
   
      console.log("Uploading file to s3 new sid");
      //await uploadToS3(s3, s3Params);
   
      const emailData = {
          from: 'csye6225@demos.siddharthgargava.me',
          to: 'siddharth27gargava@gmail.com',
          subject: 'File Uploaded Notification',
          text: 'Your file has been uploaded to GCS successfully.'
        };
   
      console.log("Sending Email");
      await sendEmail(mailgun, emailData);

      const dynamoDBParams = {
        TableName: dynamoTableName,
        Item: {
          emailSentAt: Date.now().toString(),
          recipientEmail: 'siddharth27gargava@gmail.com',
          message: 'Email sent successfully'
        }
      };

      console.log("Inserting data into DynamoDB");
      await dynamoDB.put(dynamoDBParams).promise();
   
      return 'File uploaded to GCS';
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
   
  async function downloadFile(fetch, url) {
    const response = await fetch(url);
    if (response.ok) {
      return await response.buffer();
    } else {
      throw new Error('Failed to download the file');
    }
  }
   
  // async function uploadToS3(s3, params) {
  //   return new Promise((resolve, reject) => {
  //     s3.upload(params, (err, data) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(data);
  //       }
  //     });
  //   });
  // }

  // async function uploadFileToGCS(bucketName, fileName, stream) {
  //   const gcpServiceAccountKeyFile = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');;
  //   const gcpCredentials = JSON.parse(gcpServiceAccountKeyFile);
   
    
  //   const storage = new Storage({
  //     projectId: 'develope-406002',
  //     credentials: gcpCredentials,
  // });
  
   
  //   const file = storage.bucket(bucketName).file(fileName);
  //   const writeStream = file.createWriteStream();
  
  //   return new Promise((resolve, reject) => {
  //     stream.pipe(writeStream)
  //       .on('error', reject)
  //       .on('finish', () => {
  //         console.log(`File ${fileName} uploaded to ${bucketName}.`);
  //         resolve();
  //       });
  //   });
  // }

  async function uploadToGCS(storage, bucketName, gcsFileName, fileData) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(gcsFileName);
   
    return new Promise((resolve, reject) => {
        file.save(fileData, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
  }
   
  async function sendEmail(mailgun, data) {
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (error, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      });
  }