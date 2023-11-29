import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand, ScanCommand, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import env from "./env.js";
import logger from "./logger.js";

const dynamoClient = new DynamoDBClient({
    region: env.AWS_REGION_NAME,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
});
const tableName = env.AWS_DYNAMO_QUEUE_TABLE;


export async function updateJobInitiation({ jobId, template, xlFile }) {
    logger.info(`Checking Job Status`);

    const now = new Date().toISOString();
    const putItemCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
            jobId: { S: jobId },
            createdAt: { S: now },
            updatedAt: { S: now },
            status: { S: "PROCESSING" },
            temmplate: { S: template },
            xlFile: { S: xlFile },
            logs: { S: "" }
        },
        ConditionExpression: "attribute_not_exists(jobId)"
    });
    try {
        await dynamoClient.send(putItemCommand);
        return true;
    } catch (error) {
        if(error instanceof ConditionalCheckFailedException) {}
        else { logger.error(error) }
        return false;
    }
}


// Function to complete a job
export async function updateJobCompletion(jobId, logs) {
  const now = new Date().toISOString();
  const updateItemParams = {
    TableName: tableName,
    Key: {
      jobId: { S: jobId },
    },
    UpdateExpression: "SET #status = :completed, updatedAt = :now, #logs = :logs",
    ExpressionAttributeNames: {
      "#status": "status",
      "#logs": "logs",
    },
    ExpressionAttributeValues: {
      ":completed": { S: "COMPLETED" },
      ":now": { S: now },
      ":logs": { S: logs },
    },
    ConditionExpression: "attribute_exists(jobId)", 
    ReturnValues: "ALL_NEW",
  };

  try {
    const updateItemCommand = new UpdateItemCommand(updateItemParams);
    const data = await dynamoClient.send(updateItemCommand);
    console.log("Job completed successfully");
  } catch (error) {
    console.error("Error completing job");
  }
}



// // Specify the attribute to update and its new value
// const updateExpression = "SET #status = :newName";
// const expressionAttributeNames = { "#name": "name" };
// const expressionAttributeValues = { ":newName": { S: "Updated Name" } }; // Example: New string value

// // Define the UpdateItem command
// const updateItemParams = {
//   TableName: tableName,
//   Key: updateKey,
//   UpdateExpression: updateExpression,
//   ExpressionAttributeNames: expressionAttributeNames,
//   ExpressionAttributeValues: expressionAttributeValues,
//   ReturnValues: "ALL_NEW", // or "ALL_OLD" or "UPDATED_NEW" or "UPDATED_OLD"
// };

// // Specify the table name and key of the item to retrieve
// const getKey = {
//   id: { N: "1" }, // Example: Numeric attribute
// };

// // Define the GetItem command
// const getItemParams = {
//   TableName: tableName,
//   Key: getKey,
// };

// // Execute the GetItem command
// const getItemCommand = new GetItemCommand(getItemParams);
// const scanCommand = new ScanCommand({
//     TableName: tableName,
//     Limit: 4
// })

// export const getData = dynamoClient.send(scanCommand)
//   .then((data) => {
//     if (data) {
//       console.log("Retrieved item:", data.Items);
//     } else {
//       console.log("Item not found");
//     }
//   })
//   .catch((error) => {
//     console.error("Error retrieving item:", error);
//   });


// // Specify the table name, key of the item to update, and the new attribute value
// const updateKey = {
//   id: { N: "1" }, // Example: Numeric attribute
// };

// // Specify the attribute to update and its new value
// const updateExpression = "SET #name = :newName";
// const expressionAttributeNames = { "#name": "name" };
// const expressionAttributeValues = { ":newName": { S: "Updated Name" } }; // Example: New string value

// // Define the UpdateItem command
// const updateItemParams = {
//   TableName: tableName,
//   Key: updateKey,
//   UpdateExpression: updateExpression,
//   ExpressionAttributeNames: expressionAttributeNames,
//   ExpressionAttributeValues: expressionAttributeValues,
//   ReturnValues: "ALL_NEW", // or "ALL_OLD" or "UPDATED_NEW" or "UPDATED_OLD"
// };

// // Execute the UpdateItem command
// // const updateItemCommand = new UpdateItemCommand(updateItemParams);

// // const update = dynamoClient.send(updateItemCommand)
// //   .then((data) => {
// //     console.log("Updated item:", data.Attributes);
// //   })
// //   .catch((error) => {
// //     console.error("Error updating item:", error);
// //   });



// // Specify the table name and key of the item to delete
// const deleteKey = {
//   id: { N: "1" }, // Example: Numeric attribute
// };

// // Define the DeleteItem command
// const deleteItemParams = {
//   TableName: tableName,
//   Key: deleteKey,
// };

// // Execute the DeleteItem command
// const deleteItemCommand = new DeleteItemCommand(deleteItemParams);

// const deleteFn = dynamoClient.send(deleteItemCommand)
//   .then(() => {
//     console.log("Item deleted successfully");
//   })
//   .catch((error) => {
//     console.error("Error deleting item:", error);
//   });
