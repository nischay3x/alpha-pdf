import axios from "axios";
import fs from "fs/promises";
import env from "./env.js";
import path from "path";

const s3PathPrefix = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION_NAME}.amazonaws.com`;

export default async function downloadFromS3(name, directory) {
    const { data } = await axios.get(`${s3PathPrefix}/${name}`, { responseType: 'stream' });
    return fs.writeFile(path.join(env.root, directory, name), data);
}
