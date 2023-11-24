import { createPool } from "generic-pool";
import puppeteer from "puppeteer";

const factory = {
    create: async () => {
      const browser = await puppeteer.launch({ headless: "new" });
      return browser;
    },
    destroy: async (browser) => {
      await browser.close();
    },
};
const pool = createPool(factory, { max: 5 });

export default pool;