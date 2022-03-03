import { prompt } from 'inquirer';
import { Page, WaitForOptions, ElementHandle } from 'puppeteer';

import { getRandomItem } from './utils';

const BOOK_FORMAT = 'Paperback';
const waitOptions: WaitForOptions = { waitUntil: 'load' };

const addToCart = async (
  page: Page,
  bookElement: ElementHandle,
  bookTitle: string,
) => {
  const [bookFormatPage] = await page.$x(
    `//h1/span[contains(., "${BOOK_FORMAT}")]`,
  );
  if (!bookFormatPage) {
    await Promise.all([page.waitForNavigation(), bookElement.click()]);
  }

  try {
    await Promise.all([
      page.waitForNavigation(waitOptions),
      page.click('#add-to-cart-button'),
    ]);

    await Promise.all([
      page.waitForNavigation(waitOptions),
      page.click('#nav-cart'),
    ]);

    await Promise.all([
      page.waitForNavigation(waitOptions),
      page.click("input[name='proceedToRetailCheckout']"),
    ]);

    return 'success';
  } catch (error) {
    console.error(
      `Could not add ${BOOK_FORMAT} format of ${bookTitle} to cart`,
    );
    await page.reload();
    return 'failure';
  }
};

const searchBook = async (page: Page, bookTitle: string) => {
  await page.evaluate(
    () =>
      ((<HTMLInputElement>(
        document.querySelector('.nav-search-field input')
      )).value = ''),
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

const retryPrompt = async (
  message: string,
  page: Page,
  bookTitles: string[],
) => {
  const response = await prompt({
    type: 'confirm',
    name: 'startAgain',
    message: message,
    default: false,
  });
  if (response['startAgain']) {
    await buyBook(page, bookTitles);
  }
};

export const buyBook = async (page: Page, bookTitles: string[]) => {
  const bookTitle = getRandomItem(bookTitles);
  const bookElement = await searchBook(page, bookTitle);

  if (bookElement) {
    const status = await addToCart(page, bookElement, bookTitle);
    if (status === 'failure') {
      const message = 'Could not add the book format, do you want to retry?';
      await retryPrompt(message, page, bookTitles);
    }
  } else {
    const message = 'Could not find the book format, you want to try again?';
    await retryPrompt(message, page, bookTitles);
  }
};
