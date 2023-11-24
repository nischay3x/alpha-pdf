import { workerData, parentPort } from "worker_threads";
import puppeteerPool from "./puppeteer-pool.js";
import puppeteer from "puppeteer";

async function generatePDF(htmlContent, name) {
    // try {
        const browser = await puppeteerPool.acquire();
        // const browser = await puppeteer.launch({ headless: "new" })
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        await page.pdf({ path: `./processed/${name}` });
        await puppeteerPool.release(browser);
        // await browser.close();
        // console.info(`PDF generated successfully: ${name}`);
        parentPort.postMessage(name);
    // } catch (error) {
        // console.error(`generating PDF (${name}) : ${error.message}`);
    // }
}

generatePDF(workerData.htmlContent, workerData.name)