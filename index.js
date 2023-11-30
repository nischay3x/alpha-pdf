import fs from "fs/promises";
import path from "path";
import processXlsxFile from "./utils/xl-processor.js";
import downloadFromS3 from "./utils/downloadFromS3.js";
import { getQueueTasks, deleteQueueTask } from "./utils/sqs.js";
import env from "./utils/env.js";
import { updateJobInitiation, updateJobCompletion, updateJobFailed } from "./utils/dynamo.js";
import combined, { processLogger, serverLogger } from "./utils/logger.js";

let processing = false;

async function run() {
    if (!processing) {
        processing = true;

        serverLogger.info("Fetching tasks");
        const taskQueue = await getQueueTasks();
        
        if (taskQueue.Messages) {
            const task = taskQueue.Messages[0];
            const receiptHandle = task.ReceiptHandle;

            const logFilePath = path.join(env.root, 'process.log');
            await fs.truncate(logFilePath, 0);

            try {
                const body = JSON.parse(task.Body);
                const { mapping, jobId, template, xlFile } = body;
                combined.info(`Job Id: ${jobId}`);

                const isNotBeingProcessed = await updateJobInitiation(body);

                if (isNotBeingProcessed) {
                    await deleteQueueTask(receiptHandle);
                    processLogger.info(`Deleting from Queue`);

                    await Promise.all([
                        downloadFromS3(template, "templates"),
                        downloadFromS3(xlFile, "xls-file")
                    ]);
                    processLogger.info("Resource files downloaded!");

                    try {
                        await processXlsxFile(xlFile, template, mapping, jobId);
                        await updateJobCompletion(jobId);
                    } catch (error) {
                        processLogger.error(error);
                        await updateJobFailed(jobId);
                    }

                }
            } catch (error) {
                if (error instanceof SyntaxError) {
                    processLogger.error("Invalid JSON in task body!")
                } else {
                    processLogger.error(error.message);
                }
            }
        } else {
            serverLogger.info("Queue Empty!");
        }
        processing = false;
    }
}


setInterval(() => {
    if (!processing) {
        
        serverLogger.info(`----- Timeout ${env.QUEUE_TIMEOUT_IN_MS} -----`);
        run();
    }
}, parseInt(env.QUEUE_TIMEOUT_IN_MS))


