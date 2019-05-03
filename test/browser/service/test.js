const puppeteer = require('puppeteer');
const assert = require('assert');

/**
 * `runTest` is the entry point into the browser test. It opens a webpage and checks
 * The content of the webpage is as expected, i.e., equal to `expectedTitle`.
 * See test/browser/index.html.
 */
async function runTest() {
  // Open browser at the test's webpage.
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('localhost:8000/test/browser/service');

  // Get the test's html content.
  const h1 = await page.$('#test');
  let output = await page.evaluate(element => element.innerHTML, h1);

  // Shut down.
  await browser.close();

  // Check the test worked as expected.
  if (output !== expectedTitle) {
	console.error(`Invalid output. ${output} != ${expectedTitle}`);
	process.exit(1);
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const expectedTitle = '{"sighash":{"0":221,"1":239,"2":164,"3":171},"input":[{"f1":1,"f3":{"test":0},"f4":[{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":1},{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":2},{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":3}]},{"0":18,"1":52}]}';


runTest();