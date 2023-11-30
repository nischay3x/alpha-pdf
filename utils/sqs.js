import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import env from "./env.js";

const sqsClient = new SQSClient({ 
    region: env.AWS_REGION_NAME,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
 });

const queueUrl = env.AWS_QUEUE_URL;

export const sendMessage = (params) => {
    console.info(`Queueing Job`);
    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(params)
    });
    return sqsClient.send(command);
}

const receiveParams = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1, // Maximum number of messages to receive
    VisibilityTimeout: 10, // Time during which the message will be invisible to others (seconds)
    WaitTimeSeconds: 0, // Long polling: 0 for short polling, > 0 for long polling
};
const command = new ReceiveMessageCommand(receiveParams);
export const getQueueTasks = () => sqsClient.send(command);


export const deleteQueueTask = (recieptHandle) => {
    const deleteParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: recieptHandle
    };
    const command = new DeleteMessageCommand(deleteParams);

    return sqsClient.send(command);
}