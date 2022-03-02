#!/usr/bin/env node
import { prompt } from 'inquirer';
import { AMAZON_URL } from './constants';
import { initialize } from './utils';
import { getBookTitles } from './goodReads';
import { buyBook } from './amazon';

const scrapper = async () => {
  const bookTitles = await getBookTitles();

  const [page, browser] = await initialize(AMAZON_URL, { headless: false });

  await buyBook(page, bookTitles);

  const response = await prompt({
    type: 'confirm',
    name: 'quit',
    message: 'Task completed... Do you want to quit the program?',
    default: false,
  });
  if (response['quit']) {
    await browser.close();
  }
};

scrapper();
