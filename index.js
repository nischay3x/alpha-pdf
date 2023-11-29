import processXlsxFile from "./utils/xl-processor.js";
import downloadFromS3 from "./utils/downloadFromS3.js";
import { getQueueTasks, deleteQueueTask } from "./utils/sqs.js";
import env from "./utils/env.js";
import { updateJobInitiation, updateJobCompletion } from "./utils/dynamo.js";
import logger from "./utils/logger.js";

async function run() {
    logger.info("------------------------------------");

    const taskQueue = await getQueueTasks();
    if (taskQueue.Messages) {
        const task = taskQueue.Messages[0];
        const receiptHandle = task.ReceiptHandle;

        try {
            const body = JSON.parse(task.Body);
            const { mapping, jobId, template, xlFile } = body;
            logger.info(`Job Id: ${jobId}`);

            const isNotBeingProcessed = await updateJobInitiation(body);
            logger.info(`STARTING JOB: ${jobId}`);

            if (isNotBeingProcessed) {
                await deleteQueueTask(receiptHandle);

                await downloadFromS3(template, "templates");
                await downloadFromS3(xlFile, "xls-file");

                await processXlsxFile(xlFile, template, mapping);
                await updateJobCompletion(jobId, "");

                logger.info(`Deleting from Queue`)
            } else {
                logger.info("Job Already In Progress!");
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                logger.error("Invalid JSON in task body!", error)
            } else {
                logger.error(error);
            }
        }
    } else {
        console.log("NO ITEMS IN QUEUE");
    }
    initiate();
}

function initiate() {
    logger.info('Waiting to start ...');
    setTimeout(() => {
        run();
    }, parseInt(env.QUEUE_TIMEOUT_IN_MS))
}

initiate();

// '{"jobId":"alpha2","template":"air.html","xlFile":"file_100.xlsx","mapping":{"masterpolicy_no":"Master Policy Number","reference_id":"Reference ID","name":"Name","email":"Personal Email ID","mobile_no":"Mobile No","gender":"Gender","date_of_birth":"Date of Birth","product_name":"Product name","type":"Type","coverage":"Coverage","premium":"Premium","igst":"IGST","premium_with_gst":"Premium with GST","trip_start":"Trip start date","trip_end":"Trip end date","no_of_days":"No of Days","transaction_date":"Transaction Date","plan":"Plan","policy_type":"Policy Type","coi_number":"COI Number","__id":"Reference ID","__counter":"S.No"}}'