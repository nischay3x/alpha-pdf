import { workerData, parentPort } from "worker_threads";
import mustache from "mustache";
import puppeteer from "puppeteer";
import path from "path";
import env from "./env.js";
import { processLogger } from "./logger.js";
import { sendRowMail } from "./mail.js";

function getMapping(data, config) {
    let id = data[config.uid];
    let fileName = id;
    if(config.fileName) {
        fileName = data[config.fileName];
    }
    let email = "";
    if(config.email) {
        email = data[config.email];
    }
    let map = {};
    const mapping = config.mapping;
    Object.keys(mapping).forEach(k => {
        map[k] = data[mapping[k]];
    });

    return { id, map, fileName, email };
}

async function processChunk(chunk, template, config) {
    let id = "";
    let successful = 0;
    let toSendTask = [];
    try {
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        for (let index = 0; index < chunk.length; index++) {
            let data = chunk[index];
            
            const ref = getMapping(data, config);
            
            id = ref.id;
            const map = ref.map;
            const fileName = ref.fileName;
            const email = ref.email;

            const pdfPath = path.join(env.root, 'processed', `${fileName}.pdf`);

            let htmlContent = mustache.render(template, map);
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                landscape: false,
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            if(config.mailEachRow){
                let emailBody = mustache.render(config.emailBody, map);
                toSendTask.push(sendRowMail( email, emailBody, pdfPath ));
            }
                
            page.close();
            successful += 1;
        }

        browser.close();
        await Promise.all(toSendTask);
        parentPort.postMessage(successful);
    } catch (error) {
        processLogger.error(`Generating PDF ${id}: ${error.message}`);
    }
}

processChunk(workerData.chunk, workerData.template, workerData.config);


