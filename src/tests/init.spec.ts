import { Quickteller } from '../';
import dotenv from 'dotenv';

beforeAll(() => dotenv.config());

test('it initializes the quickteller soap client', async () => {
  const quickteller = new Quickteller();

  expect(() => quickteller.isClientInitialized()).toThrow();

  await quickteller.init(
    process.env.QUICKTELLER_SOAP_URL,
    process.env.QUICKTELLER_TERMINAL_ID,
    process.env.QUICKTELLER_REQUEST_PREFIX
  );

  expect(quickteller.isClientInitialized()).toBe(true);
}, 15000);

test('it throws an error if any of the methods are called without initializing the client', async () => {
  const quickteller = new Quickteller();
  const methods = [
    'getBillerCategories',
    'getBillers',
    'getLatestBillers',
    'getBillerPaymentItems',
    'validateCustomer',
    'sendBillPaymentAdvice',
    'queryTransaction',
  ];

  for (const method of methods) {
    try {
      await quickteller[method]();
    } catch (err) {
      expect(err.message).toMatch(
        'Please initialize the Quickteller client first by calling `.init()`'
      );
    }
  }
});
