const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const https = require('https');
//const ses = new AWS.SES();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const mailgun = require('mailgun-js')({
    apiKey: '77a86bf3290ad11535b7e314d9eeec8f-5d2b1caa-3b57900a',
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
   
      const fileData = await downloadFile(fetch.default, fileUrl);
      const bucketName = 'testcsyesid';
      const fileName = 'test.zip';
   
      const s3 = new AWS.S3();
      const s3Params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileData,
        ACL: 'private'
      };
   
      console.log("Uploading file to s3");
      await uploadToS3(s3, s3Params);
   
      const emailData = {
          from: 'csye6225@demos.siddharthgargava.me',
          to: 'siddharth27gargava@gmail.com',
          subject: 'File Uploaded Notification',
          text: 'Your file has been uploaded to S3 successfully.'
        };
   
      console.log("Sending Email");
      await sendEmail(mailgun, emailData);
   
      return 'File uploaded to S3';
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
   
  async function uploadToS3(s3, params) {
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
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