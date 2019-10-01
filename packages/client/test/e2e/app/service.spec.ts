import oasis from '../../../src/';

const process = require('process');
const path = require('path');

jest.setTimeout(20000);

describe('Counter', () => {
  let service: any;

  configureEnvironment();

  const cases = [
    {
      label: 'confidential',
      header: { confidential: true },
      options: { gasLimit: '0xe79732' },
    },
    {
      label: 'non-confidential',
      header: { confidential: false },
      options: {},
    },
  ];

  cases.forEach(c => {
    const startCount = 5;

    it(`${c.label}: deploys a contract`, async () => {
      service = await oasis.workspace.Counter.deploy(startCount, {
        header: c.header,
        ...c.options,
      });

      expect(service).toBeTruthy();
    });

    it(`${c.label}: executes an RPC`, async () => {
      const count = await service.getCounter(c.options);

      expect(count).toBe(startCount);
    });

    it(`${c.label}: executes an RPC to change the state`, async () => {
      await service.incrementCounter(c.options);
      const count = await service.getCounter(c.options);

      expect(count).toBe(startCount + 1);
    });

    // Save the logs for next few tests.
    let logs: any[];

    it(`${c.label}: adds an event listener for multiple events`, async () => {
      const eventName = 'Incremented';

      logs = await new Promise(async resolve => {
        const logs: any[] = [];
        service.addEventListener(eventName, function listener(event: any) {
          logs.push(event);
          if (logs.length === 3) {
            service.removeEventListener(eventName, listener);
            resolve(logs);
          }
        });
        for (let k = 0; k < 3; k += 1) {
          await service.incrementCounter(c.options);
        }
      });

      for (let k = 1; k < logs.length; k += 1) {
        // Depending upon the gateway's view, we might get the log for the previous test,
        // so just ensure the logs received are monotonically increasing.
        let currentCounter = logs[k].newCounter;
        let lastCounter = logs[k - 1].newCounter;

        expect(currentCounter - lastCounter).toEqual(1);
      }
    });

    it(`${c.label}: translates event object keys to camelCase`, () => {
      logs.forEach(l => {
        // The value of newCounter is valid because we check it in the test case
        // above. So just ensure we have translated the nested event object keys
        // in addition.
        expect(l.newCounter).toEqual(l.inner.innerCounter);
      });
    });
  });

  afterAll(() => {
    oasis.disconnect();
  });
});

/**
 * Sets all required environment variables for the test suite.
 */
function configureEnvironment(): void {
  process.env.OASIS_WORKSPACE = path.join(process.cwd(), 'test/e2e');
  process.env.OASIS_PROFILE = 'local';
}
