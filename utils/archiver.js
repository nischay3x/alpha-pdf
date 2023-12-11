import fs from "fs/promises";
import fsc from "fs";
import archiver from "archiver";
import path from "path";
import env from "./env.js";
import uploadToFolder from "./uploadToS3.js";

export async function cleanUp() {
    const directory = path.join(env.root, 'processed');
    await fs.rm(directory, { recursive: true });
    await fs.mkdir(directory);
}

export default function archive(jobId) {
    return new Promise((resolve, rejects) => {
        const output = fsc.createWriteStream(`${jobId}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 } 
        });
        output.on('close', async () => {
            const buffer = await fs.readFile(path.join(env.root, `${jobId}.zip`));
            await uploadToFolder("archive", `${jobId}.zip`, buffer);
            resolve(`https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION_NAME}.amazonaws.com/archive/${jobId}.zip`);
        });

        archive.on('error', (err) => {
            rejects(err);
        });

        archive.pipe(output);

        archive.directory(path.join(env.root, "processed"), false);

        archive.finalize();
    })
}