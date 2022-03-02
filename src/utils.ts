import * as puppeteer from 'puppeteer';
import { Page, Browser } from 'puppeteer';

const WIDTH = 1366;
const HEIGHT = 768;

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

  await page.setViewport({ width: WIDTH, height: HEIGHT });

  try {
    await page.goto(url);
  } catch (error) {
    console.log('An error occured during page load');
    await browser.close();
    throw error;
  }

  return [page, browser];
};
