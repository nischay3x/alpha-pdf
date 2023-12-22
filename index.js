import fs from "fs/promises";
import path from "path";
import processXlsxFile from "./utils/xl-processor.js";
import downloadFromS3 from "./utils/downloadFromS3.js";
import { getQueueTasks, deleteQueueTask } from "./utils/sqs.js";
import env from "./utils/env.js";
import { updateJobInitiation, updateJobCompletion, updateJobFailed } from "./utils/dynamo.js";
import combined, { processLogger, serverLogger } from "./utils/logger.js";
import createArchive, { cleanUp } from "./utils/archiver.js";
import { sendBatchCompleteMail } from "./utils/mail.js";

let processing = false;

async function run() {
    if (!processing) {
        processing = true;

        console.info("Fetching tasks");
        const taskQueue = await getQueueTasks();

        if (taskQueue.Messages) {
            const task = taskQueue.Messages[0];
            const receiptHandle = task.ReceiptHandle;

            const logFilePath = path.join(env.root, 'process.log');
            await fs.truncate(logFilePath, 0);

            let currentJobId = "";

            try {
                const body = JSON.parse(task.Body);
                const { configFile, jobId, templateFile, xlFile } = body;
                currentJobId = jobId;
                combined.info(`Job Id: ${jobId}`);

                const isNotBeingProcessed = await updateJobInitiation(body);

                if (isNotBeingProcessed) {
                    await deleteQueueTask(receiptHandle);
                    processLogger.info(`Deleting from Queue`);

                    await Promise.all([
                        downloadFromS3(templateFile, "templates"),
                        downloadFromS3(xlFile, "xls-file"),
                        downloadFromS3(configFile, "config")
                    ]);
                    processLogger.info("Resource files downloaded!");

                    const configString = await fs.readFile(path.join(env.root, 'config', configFile), { encoding: 'utf-8' });
                    const config = JSON.parse(configString);

                    try {
                        await processXlsxFile(xlFile, templateFile, config, jobId);

                        let archiveLink = "";
                        if(config.createArchive) {
                            archiveLink = await createArchive(jobId);
                            processLogger.info("Archive Created!");
                            await sendBatchCompleteMail(config.reportEmail, jobId, archiveLink);
                            processLogger.info("Report Email Sent!");
                            await fs.rm(path.join(env.root, `${jobId}.zip`));
                        }

                        await fs.rm(path.join(env.root, 'config', configFile));
                        await cleanUp();
                        serverLogger.info("Cleaned!");

                        await updateJobCompletion(jobId, archiveLink);
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
                await updateJobFailed(currentJobId);
            }
        } else {
            console.info("Queue Empty!");
        }
        processing = false;
    }
}


setInterval(() => {
    if (!processing) {
        console.info(`----- Timeout ${env.QUEUE_TIMEOUT_IN_MS} -----`);
        run();
    }
}, parseInt(env.QUEUE_TIMEOUT_IN_MS))


