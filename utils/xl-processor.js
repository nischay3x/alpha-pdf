import fs from "fs/promises";
import { Worker } from "worker_threads";
import xlsx from "xlsx";
import path from "path";
import env from "./env.js";

const threadCount = parseInt(env.WORKER_THREAD_COUNT);

function getChunkGroups(array, chunkSize, groupSize) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunkedArray.push(array.slice(i, i + chunkSize));
    }

    const groupedArray = [];
    for (let i = 0; i < chunkedArray.length; i += groupSize) {
        groupedArray.push(chunkedArray.slice(i, i + groupSize));
    }

    return groupedArray;
}

function processChunk(chunk, template, mapping) {
    const worker = new Worker("./utils/pdf-generator.js", {
        workerData: {
            chunk, template, mapping
        }
    });
    return new Promise((resolve, reject) => {
        worker.once('message', (length) => {
            worker.terminate();
            let count = parseInt(length);
            resolve(count);
        })
        worker.once('error', (err) => {
            console.log(err);
            reject();
        })
    })
}

export default async function readXlsxFile(fileName, templateName, mapping) {
    try {
        let workbook = xlsx.readFile(path.join(env.root, 'xls-file', fileName));
        const template = await fs.readFile(path.join(env.root, 'templates', templateName), { encoding: 'utf-8' });

        let processed = 0;

        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];

        const json = xlsx.utils.sheet_to_json(worksheet);
        const totalRows = json.length;
        const chunkSize = Math.ceil(totalRows / threadCount);

        // console.log(`Chunk Size: ${chunkSize} || Thread Count: ${threadCount}`);
        console.log(`Rows: ${totalRows} | Thread: ${threadCount} | Chunk: ${chunkSize}`);
        console.log("------------------------------------");

        let start = Date.now();

        let chunksGroups = getChunkGroups(json, chunkSize, threadCount);
        for (let i = 0; i < chunksGroups.length; i++) {
            const group = chunksGroups[i];
            let tasks = [];
            for (let j = 0; j < group.length; j++) {
                const chunk = group[j];
                tasks.push(processChunk(chunk, template, mapping))
            }
            let results = await Promise.all(tasks);

            processed += results.reduce((a, b) => a + b);

            console.log(`-------- ${processed} Rows Processed -------`);
        }

        let end = Date.now();
        console.log(`Time Taken: ${end - start} ms`)

    } catch (error) {
        console.error(`reading XLSX file: ${error.message}`);
    }
}

