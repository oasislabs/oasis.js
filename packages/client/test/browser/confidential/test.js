const puppeteer = require('puppeteer');

/**
 * `runTest` is the entry point into the crypto test. It opens a webpage and checks
 * The content of the webpage is as expected, i.e., equal to `expectedTitle`.
 * See test/browser/index.html.
 */
async function runTest() {
  // Open browser at the test's webpage.
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('localhost:8000/test/browser/confidential');

  // Get the test's html content.
  const h1 = await page.$('#test');
  let output = await page.evaluate(element => element.innerHTML, h1);

  // Shut down.
  await browser.close();

  let expectedTitle = JSON.stringify(new Uint8Array([1, 2, 3, 4]));

  // Check the test worked as expected.
  if (output !== expectedTitle) {
    console.error(`Invalid output. ${output} != ${expectedTitle}`);
    process.exit(1);
  }
}

runTest();
