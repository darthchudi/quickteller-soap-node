import quickteller from '../';
import dotenv from 'dotenv';
import { QuicktellerError } from '../errors';

beforeAll(async () => {
  dotenv.config();

  await quickteller.init(
    process.env.QUICKTELLER_SOAP_URL,
    process.env.QUICKTELLER_TERMINAL_ID,
    process.env.QUICKTELLER_REQUEST_PREFIX
  );
}, 15000);

test('it gets all methods on the soap client', () => {
  const methods = quickteller.getMethods();

  expect(methods).toBeInstanceOf(Object);
  expect(methods).toHaveProperty('QuickTellerService');
});

test('it gets biller categories', async () => {
  const billerCategories = await quickteller.getBillerCategories();

  expect(billerCategories).toBeInstanceOf(Array);
  expect(billerCategories.length).toBeGreaterThan(0);

  const category = billerCategories[1];

  expect(category.Id).toBe('2');
  expect(category.Description).toBe('Pay for your cable TV subscriptions here');
  expect(category.Name).toBe('Cable TV Bills');
});

test('it gets billers', async () => {
  const billers = await quickteller.getBillers(2);

  expect(billers).toBeInstanceOf(Array);
  expect(billers.length).toBeGreaterThan(0);

  const biller = billers[1];

  expect(biller.Id).toBe('104');
  expect(biller.Name).toBe('DSTV Subscription');
  expect(biller.CustomerField1).toBe('Decoder Number');
  expect(biller.Narration).toBe('Pay DSTV bills');
});

test('it gets a specific biller by id', async () => {
  const billers = await quickteller.getBillers(9, 111);

  expect(billers).toBeInstanceOf(Array);
  expect(billers.length).toBe(1);

  const [biller] = billers;

  expect(biller.Id).toBe('111');
  expect(biller.Name).toBe('IPNX');
  expect(biller.CustomerField1).toBe('Account Number/Wireless telephone');
  expect(biller.Narration).toBe('Pay IPNX subscriptions');
});

test('it throws an error if Quickteller responds with an empty list for a biller query', async () => {
  expect.assertions(2);

  try {
    await quickteller.getBillers(8848);
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toBe(
      'Quickteller could not find billers that satsify this query'
    );
  }
});

test('it gets latest billers', async () => {
  const billers = await quickteller.getLatestBillers();

  expect(billers).toBeInstanceOf(Array);
  expect(billers.length).toBeGreaterThan(0);

  const [biller] = billers;

  expect(biller.Id).toBe('14316');
  expect(biller.Name).toBe('NAIRABET');
});

test("it gets a biller's payment items", async () => {
  const paymentItems = await quickteller.getBillerPaymentItems(104);

  expect(paymentItems).toBeInstanceOf(Array);
  expect(paymentItems.length).toBe(4);

  paymentItems.forEach(item => {
    expect(item.Id).toBeDefined();
    expect(item.Name).toBeDefined();
    expect(item.Amount).toBeDefined();
  });
});

test("it throws an error if Quickteller is unable to find a biller's payment items", async () => {
  expect.assertions(2);

  try {
    await quickteller.getBillerPaymentItems(4949494);
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(/Quickteller could not find the biller/);
  }
});

test('it validates a customer', async () => {
  const customerValidation = await quickteller.validateCustomer(
    10401,
    '0000000001'
  );

  expect(customerValidation.FullName).toBe('Test Test');
  expect(customerValidation.CustomerId).toBe('0000000001');
  expect(customerValidation.Amount).toBe('1460000');
});

test('it throws an error if a customer fails a validation', async () => {
  expect.assertions(2);

  try {
    await quickteller.validateCustomer(10401, 'dmefrfmkrf');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while validating customer id/
    );
  }
});

test('it throws an error if an invalid payment code is provided for customer validation', async () => {
  expect.assertions(2);

  try {
    await quickteller.validateCustomer(10401111, '');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /PaymentTypeValidation Process should have run before calling this property/
    );
  }
});
