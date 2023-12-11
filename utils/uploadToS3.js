import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import env from './env.js';

const s3Client = new S3Client({
  region: env.AWS_REGION_NAME,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

export default async function uploadToFolder(folderName, fileName, fileContent) {
  const folderKey = `${folderName}/`;

  const params = {
    Bucket: env.AWS_BUCKET_NAME,
    Key: `${folderKey}${fileName}`,
    Body: fileContent,
  };

  const command = new PutObjectCommand(params);
  return s3Client.send(command);
}

