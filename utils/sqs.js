import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import env from "./env.js";
import logger from "./logger.js";

// Create an SQS client
const sqsClient = new SQSClient({ 
    region: env.AWS_REGION_NAME,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
 });

const queueUrl = env.AWS_QUEUE_URL;

// const messageParams = {
//     QueueUrl: queueUrl,
//     MessageBody: "Hello, SQS!",
// };

// const sendCommand = new SendMessageCommand(messageParams);

// sqsClient.send(sendCommand)
//     .then((data) => {
//         console.log("Message sent successfully:", data.MessageId);
//     })
//     .catch((error) => {
//         console.error("Error sending message:", error);
//     });

// const receiveCommand = new ReceiveMessageCommand(receiveParams);

// sqsClient.send(receiveCommand)
//     .then((data) => {
//         if (data.Messages && data.Messages.length > 0) {
//             const receivedMessage = data.Messages[0];
//             console.log("Received message:", receivedMessage.Body);

//             // Delete the received message from the queue
//             const deleteParams = {
//                 QueueUrl: queueUrl,
//                 ReceiptHandle: receivedMessage.ReceiptHandle,
//             };
//             const deleteCommand = new DeleteMessageCommand(deleteParams);

//             return sqsClient.send(deleteCommand);
//         } else {
//             console.log("No messages received");
//         }
//     })
//     .then(() => {
//         console.log("Message deleted successfully");
//     })
//     .catch((error) => {
//         console.error("Error receiving message:", error);
//     });

export const sendMessage = (params) => {
    logger.info(`Queueing Job`)
    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(params)
    });
    return sqsClient.send(command);
}

const receiveParams = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1, // Maximum number of messages to receive
    VisibilityTimeout: 30, // Time during which the message will be invisible to others (seconds)
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