import dotenv from "dotenv";
import path from "path";
dotenv.config();


const env = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION_NAME: process.env.AWS_REGION_NAME,
    AWS_QUEUE_URL: process.env.AWS_QUEUE_URL,
    AWS_DYNAMO_QUEUE_TABLE: process.env.AWS_DYNAMO_QUEUE_TABLE,
    WORKER_THREAD_COUNT: process.env.WORKER_THREAD_COUNT,
    QUEUE_TIMEOUT_IN_MS: process.env.QUEUE_TIMEOUT_IN_MS,
    root: path.resolve(process.cwd(), "./")
}

export default env;
