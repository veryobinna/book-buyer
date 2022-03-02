import * as puppeteer from 'puppeteer';
import { Page, Browser } from 'puppeteer';

export const getRandomItem = (items: string[]) => {
  const random = Math.floor(Math.random() * items.length);
  return items[random];
};

export const initialize = async (
  url: string,
  options?: { headless: boolean },
): Promise<[page: Page, browser: Browser]> => {
  let browser;

  if (typeof options !== 'undefined') {
    browser = await puppeteer.launch(options);
  } else {
    browser = await puppeteer.launch();
  }

  const page = await browser.newPage();

  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(url);

  return [page, browser];
};
