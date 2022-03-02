#!/usr/bin/env node
import * as puppeteer from 'puppeteer';
import * as inquirer from 'inquirer';
import { AMAZON_URL, GOOD_READS_URL } from './constants';
import {
  launch,
  Page,
  WaitForOptions,
  Browser,
  ElementHandle,
} from 'puppeteer';

console.log("launch",launch)

const waitOptions: WaitForOptions = { waitUntil: 'load' };

const initialize = async (
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
const getGenre = async (page: Page) => {
  const genres = await page.$$eval('.category h4', (genres) => {
    return genres.map((item) => item.textContent?.trim());
  });

  const response = await inquirer.prompt({
    // @ts-ignore
    type: 'list',
    name: 'genre',
    message: 'What is your preferred genre?',
    choices: genres,
  });
  return response['genre'];
};
const getBookTitles = async () => {
  const [page, browser] = await initialize(GOOD_READS_URL);

  const genre = await getGenre(page);

  const [button] = await page.$x(`//a/h4[contains(., "${genre}")]`);
  await Promise.all([button.click(), page.waitForNavigation()]);
  const titles = await page.$$eval('.resultShown img', (images) => {
    return (
      images
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .map((image) => image.alt)

        .filter((title) => title !== 'saving…')
    );
  });
  await browser.close();
  return titles;
};

const getRandomTitle = (titles: string[]) => {
  const random = Math.floor(Math.random() * titles.length);
  return titles[random];
};

const addToCart = async (page: Page, item: ElementHandle) => {
  await Promise.all([page.waitForNavigation(), item.click()]);
  await Promise.all([
    page.waitForNavigation(waitOptions),
    await page.click('#add-to-cart-button'),
  ]);
  await Promise.all([
    page.waitForNavigation(waitOptions),
    await page.click('#nav-cart'),
  ]);

  await Promise.all([
    page.waitForNavigation(waitOptions),
    await page.click("input[name='proceedToRetailCheckout']"),
  ]);
};

async function searchBook(page: Page, bookTitle: string) {
  const FORMAT = 'Paperback';
  await page.evaluate(
    // @ts-ignore
    () => (document.querySelector('.nav-search-field input').value = ''),
  );
  await page.type('.nav-search-field input', bookTitle);
  await Promise.all([
    page.waitForNavigation(waitOptions),
    page.click('#nav-search-submit-button'),
  ]);

  // Select first item
  await Promise.all([
    page.waitForNavigation(waitOptions),
    page.click('.a-section h2 a'),
    page.waitForNavigation(waitOptions),
  ]);
  const [book] = await page.$x(`(//span/a[span="${FORMAT}"])[1]`);
  return book;
}

const buyBook = async (page: Page, bookTitles: string[]) => {
  const bookTitle = getRandomTitle(bookTitles);
  const paperBook = await searchBook(page, bookTitle);

  if (paperBook) {
    await addToCart(page, paperBook);
  } else {
    const response = await inquirer.prompt({
      type: 'confirm',
      name: 'startAgain',
      message: 'Could not find the book format, you want to try again?',
      default: false,
    });
    if (response['startAgain']) {
      await buyBook(page, bookTitles);
    }
  }
};

const scrapper = async () => {
  const bookTitles = await getBookTitles();

  const [page, browser] = await initialize(AMAZON_URL, { headless: false });

  await buyBook(page, bookTitles);

  const response = await inquirer.prompt({
    type: 'confirm',
    name: 'startAgain',
    message: 'Do you want to buy another book?',
    default: false,
  });
  if (response['startAgain']) {
    await buyBook(page, bookTitles);
  } else {
    console.log('Bye!');
    await browser.close();
  }
};
scrapper();
