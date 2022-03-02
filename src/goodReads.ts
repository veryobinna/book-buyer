import { Page } from 'puppeteer';
import { prompt } from 'inquirer';

import { GOOD_READS_URL } from './constants';
import { initialize } from './utils';

export const getBookTitles = async () => {
  const [page, browser] = await initialize(GOOD_READS_URL);
  const genre = await getGenre(page);

  const [button] = await page.$x(`//a/h4[contains(., "${genre}")]`);

  await Promise.all([button.click(), page.waitForNavigation()]);

  const titles = await page.$$eval('.resultShown img', (images) => {
    return images
      .map((image) => (<HTMLImageElement>image).alt)

      .filter((title) => title !== 'saving…');
  });

  await browser.close();

  return titles;
};

const getGenre = async (page: Page) => {
  const genres = await page.$$eval('.category h4', (genres) => {
    return genres.map((item) => item.textContent?.trim());
  });

  const response = await prompt([
    {
      type: 'list',
      name: 'genre',
      message: 'What is your preferred genre?',
      choices: genres,
    },
  ]);

  return response['genre'];
};
