const puppeteer = require('puppeteer');
const assert = require('assert');

/**
 * `runTest` is the entry point into the browser test. It opens a webpage and checks
 * The content of the webpage is as expected, i.e., equal to `expectedTitle`.
 * See test/browser/index.html.
 */
async function runTest() {
  // Open browser at the test's webpage.
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('localhost:8000/test/browser/e2e');

  await sleep(1000 * 30);

  const resultH1 = await page.$('#test');
  let result = await page.evaluate(element => element.innerHTML, resultH1);

  if (result !== 'success') {
    console.error('Failed');
    process.exit(1);
  }

  // Shut down.
  await browser.close();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runTest();
