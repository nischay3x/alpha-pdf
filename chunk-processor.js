import { workerData, parentPort } from "worker_threads";
import mustache from "mustache";
// import fs from "fs/promises";
import puppeteer from "puppeteer";

async function processChunk(chunk, template, mapping) {
    try {
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        for (let index = 0; index < chunk.length; index++) {
            let data = chunk[index];
            const { id, map } = getMapping(data, mapping);

            let sno = data[mapping.__counter];

            let htmlContent = mustache.render(template, map);
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
            await page.pdf({ path: `./processed/${id}.pdf` });
            console.log(`PDF Generated: ${sno}`)
            page.close();
        }

        browser.close();

        parentPort.postMessage(chunk.length);
    } catch (error) {
        console.error(`generating PDF (${name}) : ${error.message}`);
    }
}

processChunk(workerData.chunk, workerData.template, workerData.mapping);

function getMapping(data, mapping) {
    let id = data[mapping.__id];
    let map = {};
    Object.keys(mapping).forEach(k => {
        map[k] = data[mapping[k]];
    });

    return { id, map };
}
