const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const https = require('https');
//const ses = new AWS.SES();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const fetch = require('node-fetch');
const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API, 
    domain: 'demos.siddharthgargava.me'
  });

// exports.handler = async (event, context) => {
//     try {
//       const fetch = await import('node-fetch'); // Dynamic import for node-fetch
   
//       console.log(event);
//       const snsMessage = JSON.parse(event.Records[0].Sns.Message);
//       console.log(snsMessage);
//       const fileUrl = snsMessage.submissionUrl;
//       console.log(fileUrl);
//       const recEmail = snsMessage.emailId;
//       console.log(recEmail);
//       const userId = snsMessage.userId;
//       const assgnId = snsMessage.assignmentId;
//       console.log(userId);
//       console.log(assgnId);

//       const googleStorageBucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME;
//       const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
//       const googleServiceEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
//       const dynamoTableName = process.env.DYNAMO_TABLE_NAME;
//       console.log(googleStorageBucketName);
//       console.log(googleServiceAccountKey);
//       console.log(googleServiceEmail);
//       console.log(dynamoTableName);

//       const decodedPrivateKey = Buffer.from(googleServiceAccountKey, 'base64').toString('utf-8');
//       const keyFileJson = JSON.parse(decodedPrivateKey);
//       console.log(keyFileJson);
//       console.log(keyFileJson.private_key);
   
//       //const { Storage } = require('@google-cloud/storage');
//       const storage = new Storage({
//       projectId: process.env.GCP_PROJECT_ID,
//       credentials: keyFileJson
//         });
   
//       const fileData = await downloadFile(fetch.default, fileUrl);
//       const bucketName = googleStorageBucketName;
//       const fileName = userId + '/' + assignmentId + '/' + 'test_'+ Date.now().toString() +'.zip';

//       console.log("Uploading file to Google Cloud Storage");
//       await uploadToGCS(storage, googleStorageBucketName, fileName, fileData);
   
//       console.log("Uploading file to s3 new sid");
   
//       const emailData = {
//           from: 'csye6225@demos.siddharthgargava.me',
//           to: recEmail,
//           subject: 'File Uploaded Notification',
//           text: 'Your file has been uploaded to GCS successfully.'
//         };
   
//       console.log("Sending Email");
//       await sendEmail(mailgun, emailData);

//       const dynamoDBParams = {
//         TableName: dynamoTableName,
//         Item: {
//           emailSentAt: Date.now().toString(),
//           recipientEmail: recEmail,
//           message: 'Email sent successfully'
//         }
//       };

//       console.log("Inserting data into DynamoDB");
//       await dynamoDB.put(dynamoDBParams).promise();
   
//       return 'File uploaded to GCS';
//     } catch (error) {
//       console.error('Error:', error);
//       throw error;
//     }
//   };
   
//   async function downloadFile(fetch, url) {
//     const response = await fetch(url);
//     if (response.ok) {
//       return await response.buffer();
//     } else {
//       throw new Error('Failed to download the file');
//     }
//   }

//   async function uploadToGCS(storage, bucketName, gcsFileName, fileData) {
//     const bucket = storage.bucket(bucketName);
//     const file = bucket.file(gcsFileName);
   
//     return new Promise((resolve, reject) => {
//         file.save(fileData, (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve();
//             }
//         });
//     });
//   }
   
//   async function sendEmail(mailgun, data) {
//       return new Promise((resolve, reject) => {
//         mailgun.messages().send(data, (error, body) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve(body);
//           }
//         });
//       });
//   }

exports.handler = async (event, context) => {
  try {
      
      console.log(event);
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      console.log(snsMessage);
      const fileUrl = snsMessage.submissionUrl;
      console.log(fileUrl);
      const recEmail = snsMessage.emailId;
      console.log(recEmail);
      const userId = snsMessage.userId;
      const assgnId = snsMessage.assignmentId;
      console.log(userId);
      console.log(assgnId);

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

      const fileName = `${userId}/${assgnId}/test_${Date.now()}.zip`;
      const bucketName = googleStorageBucketName;

      console.log("Downloading file");
      const response = await fetch(fileUrl); 
      if (!response.ok) {
          await recordEmailEvent("failure", recEmail);
          //throw new Error('Failed to download the file');
          const emailData = {
            from: 'csye6225@demos.siddharthgargava.me',
            to:  recEmail,
            subject: 'File Upload Failed',
            text: 'Your file failed to upload to GCS. Error: Incorrect url zip path'
          };
        await sendEmail(mailgun, emailData);
        return 'File not uploaded';
      }

      const fileData = await response.buffer();
      console.log("Uploading file to Google Cloud Storage");
      await uploadToGCS(storage, bucketName, fileName, fileData);
      const signedurl = await generateSignedUrl(storage,bucketName,fileName);

      await recordEmailEvent("success", recEmail);
      const emailData = {
          from: 'csye6225@demos.siddharthgargava.me',
          to: recEmail,
          subject: 'File Uploaded Successfully Notification',
          text: 'Your file has been uploaded to GCS successfully. Filepath: ' + fileName,
      };
      console.log("Sending Email");
      await sendEmail(mailgun, emailData);

      return 'File uploaded to GCS and email sent';
  } catch (error) {
      console.error('Error:', error);
      await recordEmailEvent("failure", recEmail);
      const emailData = {
        from: 'csye6225@demos.siddharthgargava.me',
        to: recEmail,
        subject: 'File Upload Failed',
        text: 'Your file failed to upload to GCS. Error: Incorrect url zip path'
      };
      await sendEmail(mailgun, emailData);
      throw error;
  }
  finally{
    return {
      status:200
    }
  }
};

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

async function recordEmailEvent(message, email) {
  const params = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Item: {
          emailSentAt: Date.now().toString(),
          message: message,
          recipientEmail: email
      },
  };
  await dynamoDB.put(params).promise();
}

async function generateSignedUrl(storage, bucketName, fileName) {
  const options = {
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
 
  try {
    const [url] = await storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(options);
    return url;
  } catch (err) {
    console.error("Error generating signed URL:", err);
    throw err;
  }
}