import { prompt } from 'inquirer';
import { Page, WaitForOptions, ElementHandle } from 'puppeteer';

import { getRandomItem } from './utils';

const BOOK_FORMAT = 'Paperback';
const waitOptions: WaitForOptions = { waitUntil: 'load' };

const addToCart = async (page: Page, book: ElementHandle) => {
  const [bookFormatPage] = await page.$x(
    `//h1/span[contains(., "${BOOK_FORMAT}")]`,
  );
  if (!bookFormatPage) {
    await Promise.all([page.waitForNavigation(), book.click()]);
  }

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

const searchBook = async (page: Page, bookTitle: string) => {
  await page.evaluate(
    // @ts-ignore
    () => (document.querySelector('.nav-search-field input').value = ''),
  );

  await page.type('.nav-search-field input', bookTitle);

  await Promise.all([
    page.waitForNavigation(waitOptions),
    page.click('#nav-search-submit-button'),
  ]);

  await Promise.all([
    page.waitForNavigation(waitOptions),
    page.click('.a-section h2 a'),
  ]);

  const [book] = await page.$x(`(//span/a[span="${BOOK_FORMAT}"])[1]`);
  return book;
};

export const buyBook = async (page: Page, bookTitles: string[]) => {
  const bookTitle = getRandomItem(bookTitles);
  const book = await searchBook(page, bookTitle);

  if (book) {
    await addToCart(page, book);
  } else {
    const response = await prompt({
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
