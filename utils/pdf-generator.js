import { workerData, parentPort } from "worker_threads";
import mustache from "mustache";
import puppeteer from "puppeteer";
import path from "path";
import env from "./env.js";
import logger from "./logger.js";

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
    try {
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        for (let index = 0; index < chunk.length; index++) {
            let data = chunk[index];
            
            const ref = getMapping(data, mapping);
            
            id = ref.id;
            const map = ref.map;

            let sno = data[mapping.__counter];

            let htmlContent = mustache.render(template, map);
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
            await page.pdf({ path: path.join(env.root, 'processed', `${id}.pdf`) });

            console.log(`PDF Generated: ${sno}`);

            page.close();
        }

        browser.close();

        parentPort.postMessage(chunk.length);
    } catch (error) {
        logger.error(`Generating PDF ${id}: ${error.message}`);
    }
}

processChunk(workerData.chunk, workerData.template, workerData.mapping);


