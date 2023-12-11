import { workerData, parentPort } from "worker_threads";
import mustache from "mustache";
import puppeteer from "puppeteer";
import path from "path";
import env from "./env.js";
import logger, { processLogger } from "./logger.js";

function getMapping(data, mapping) {
    let id = data[mapping.__id];
    let map = {};
    Object.keys(mapping).forEach(k => {
        map[k] = data[mapping[k]];
    });

    return { id, map };
}

async function processChunk(chunk, template, mapping) {
    let id = "";
    let successful = 0;
    try {
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        for (let index = 0; index < chunk.length; index++) {
            let data = chunk[index];
            
            const ref = getMapping(data, mapping);
            
            id = ref.id;
            const map = ref.map;

            let htmlContent = mustache.render(template, map);
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
            await page.pdf({ path: path.join(env.root, 'processed', `${id}.pdf`) });

            page.close();
            successful += 1;
        }

        browser.close();

        parentPort.postMessage(successful);
    } catch (error) {
        processLogger.error(`Generating PDF ${id}: ${error.message}`);
    }
}

processChunk(workerData.chunk, workerData.template, workerData.mapping);


