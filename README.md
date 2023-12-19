# Serverless Lambda Service

This Node.js script is designed to be deployed as an AWS Lambda function. It responds to SNS (Simple Notification Service) messages, downloads files from a provided URL, uploads them to Google Cloud Storage, and notifies the user via email using Mailgun.

## Features

- **SNS Message Handling**: Processes messages received through AWS SNS, extracting key information like file URL and recipient email.
- **File Download and Upload**: Downloads a file from a URL and uploads it to a specified Google Cloud Storage bucket.
- **Email Notifications**: Sends email notifications to users upon successful upload or in case of a failure, using Mailgun.
- **DynamoDB Logging**: Records events of email sending to an AWS DynamoDB table for auditing or tracking purposes.
- **Signed URL Generation**: Generates a signed URL for the uploaded file in Google Cloud Storage, allowing secure, time-limited access to the file.

## Pre-requisites

- Node.js environment
- AWS SDK (for DynamoDB and SNS)
- Google Cloud Storage SDK `@google-cloud/storage`
- `node-fetch` for handling HTTP requests
- `mailgun-js` for sending emails

## Environment Variables

- **GOOGLE_STORAGE_BUCKET_NAME**: Name of the Google Cloud Storage bucket.
- **GOOGLE_SERVICE_ACCOUNT_KEY**: Base64 encoded Google service account key.
- **GCP_SERVICE_ACCOUNT_EMAIL**: Email of the Google service account.
- **GCP_PROJECT_ID**: Project ID of the Google Cloud Platform project.
- **DYNAMO_TABLE_NAME**: Name of the DynamoDB table for logging.
- **MAILGUN_API**: API key for Mailgun.
- **MAILGUN_DOMAIN**: Domain configured in Mailgun.

## Usage

The Lambda function triggers upon receiving an SNS message. It performs the following steps:

1. **Parse SNS Message**: Extracts file URL, recipient email, and other details from the SNS message.
2. **Download File**: Downloads the file from the provided URL.
3. **Upload to Google Cloud Storage**: Uploads the downloaded file to the specified Google Cloud Storage bucket.
4. **Email Notification**: Sends an email to the recipient using Mailgun to notify them about the upload status. It includes a signed URL for the uploaded file.
5. **Log to DynamoDB**: Records the email event (success or failure) in a DynamoDB table.

## Error Handling

The function includes error handling to catch and log any issues during the process. It ensures that in case of any failure, the user is notified, and the event is logged.

## Deployment

To deploy this script:

1. Package the script along with `node_modules`.
2. Create a new AWS Lambda function and upload the package.
3. Set the required environment variables in the Lambda configuration.
4. Configure an SNS topic to trigger the Lambda function.

> [!CAUTION]
> Ensure that the AWS IAM role associated with the Lambda function has the necessary permissions for SNS, DynamoDB, and other AWS services.

> [!IMPORTANT]
> The Google service account key should be stored securely and should have limited permissions to only necessary GCP resources.

> [!TIP]
> Validate and sanitize the input from the SNS messages to prevent potential security vulnerabilities.

## Author
[Siddharth Gargava](mailto:gargavasiddharth@gmail.com)


