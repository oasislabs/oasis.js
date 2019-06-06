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
  const plainH1 = await page.$('#plaintext-test');
  let plainOutput = await page.evaluate(element => element.innerHTML, plainH1);

  const confH1 = await page.$('#confidential-test');
  let confOutput = await page.evaluate(element => element.innerHTML, confH1);

  // Shut down.
  await browser.close();

  // Check the test worked as expected.
  if (plainOutput !== expectedTitle) {
    console.error(`Invalid plaintext output. ${plainOutput} != ${expectedTitle}`);
    process.exit(1);
  }
  if (confOutput !== expectedTitle) {
    console.error(`Invalid confidential output. ${confOutput} != ${expectedTitle}`);
    process.exit(1);
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// The expected title is the data field of the RpcRequest given to the OasisGateway interface.
const expectedTitle = '{"0":204,"1":199,"2":205,"3":227,"4":130,"5":163,"6":98,"7":102,"8":49,"9":1,"10":98,"11":102,"12":51,"13":161,"14":100,"15":116,"16":101,"17":115,"18":116,"19":0,"20":98,"21":102,"22":52,"23":131,"24":88,"25":32,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":0,"52":0,"53":0,"54":0,"55":0,"56":0,"57":1,"58":88,"59":32,"60":0,"61":0,"62":0,"63":0,"64":0,"65":0,"66":0,"67":0,"68":0,"69":0,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":0,"78":0,"79":0,"80":0,"81":0,"82":0,"83":0,"84":0,"85":0,"86":0,"87":0,"88":0,"89":0,"90":0,"91":2,"92":84,"93":0,"94":0,"95":0,"96":0,"97":0,"98":0,"99":0,"100":0,"101":0,"102":0,"103":0,"104":0,"105":0,"106":0,"107":0,"108":0,"109":0,"110":0,"111":0,"112":3,"113":66,"114":18,"115":52}'


runTest();
