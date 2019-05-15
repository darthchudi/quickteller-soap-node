import dotenv from 'dotenv';
import quickteller, {
  QuicktellerError,
  QUICKTELLER_BILLER_NOT_FOUND,
  QUICKTELLER_INVALID_TRANSACTION_AMOUNT,
  QUICKTELLER_UNRECOGNIZED_CUSTOMER,
  QUICKTELLER_XML_NODE_EMPTY,
  QUICKTELLER_XML_NODE_MISSING,
} from '../';
import { QUICKTELLER_DATA_NOT_FOUND } from '../constants';

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
      'Quickteller could not find billers that satisfy this query'
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
  expect.assertions(3);

  try {
    await quickteller.getBillerPaymentItems(4949494);
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(/Quickteller could not find the biller/);
    expect(err.quickteller_code).toBe(QUICKTELLER_BILLER_NOT_FOUND);
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
  expect.assertions(3);

  try {
    await quickteller.validateCustomer(10401, 'dmefrfmkrf');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while validating customer id/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_UNRECOGNIZED_CUSTOMER);
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

test('it sends a payment advice', async () => {
  const billPaymentAdvice = await quickteller.sendBillPaymentAdvice(
    1460000,
    10401,
    '0000000001',
    '08073292354',
    'frankdonga@ymail.com'
  );

  expect(billPaymentAdvice.ApprovedAmount).toBe('1460000');
  expect(billPaymentAdvice.RequestReference).toBeDefined();
  expect(billPaymentAdvice.TransactionRef).toBeDefined();
  expect(billPaymentAdvice.ResponseDescription).toBe('Success');
});

test('it throws an error if a payment advice is sent with an invalid amount', async () => {
  expect.assertions(4);

  try {
    await quickteller.sendBillPaymentAdvice(460000, 10401, '0000000001');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while sending bill payment advice/
    );
    expect(err.description).toMatch(
      /Transaction amount not approved by biller/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_INVALID_TRANSACTION_AMOUNT);
  }
});

test('it throws an error if a payment advice is sent with a missing amount', async () => {
  expect.assertions(3);

  try {
    await quickteller.sendBillPaymentAdvice(undefined, 10401, '0000000001');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while sending bill payment advice/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_XML_NODE_MISSING);
  }
});

test('it throws an error if a payment advice is sent with an invalid payment code', async () => {
  expect.assertions(3);

  try {
    await quickteller.sendBillPaymentAdvice(1460000, 84848, '0000000001');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(/Quickteller could not find the biller/);
    expect(err.quickteller_code).toBe(QUICKTELLER_BILLER_NOT_FOUND);
  }
});

test('it throws an error if a payment advice is sent with a missing payment code', async () => {
  expect.assertions(3);

  try {
    await quickteller.sendBillPaymentAdvice(1460000, undefined, '0000000001');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while sending bill payment advice/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_XML_NODE_EMPTY);
  }
});

test('it throws an error if a payment advice is sent with an invalid customer id', async () => {
  expect.assertions(3);

  try {
    await quickteller.sendBillPaymentAdvice(1460000, 10401, 393939);
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while sending bill payment advice/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_UNRECOGNIZED_CUSTOMER);
  }
});

test('it throws an error if a payment advice is sent with a missing customer id', async () => {
  expect.assertions(3);

  try {
    await quickteller.sendBillPaymentAdvice(1460000, 10401, undefined);
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(
      /An error occured while sending bill payment advice/
    );
    expect(err.quickteller_code).toBe(QUICKTELLER_XML_NODE_EMPTY);
  }
});

test('it queries a transaction', async () => {
  const transactionQuery = await quickteller.queryTransaction('141344a13b06');
  expect(transactionQuery.ServiceName).toBe('Premium');
  expect(transactionQuery.Status).toBe('Complete');
  expect(transactionQuery.RequestReference).toBe('141344a13b06');
  expect(transactionQuery.TransactionSet).toBe('BillPayment');
  expect(transactionQuery.CustomerMobile).toBe('08073292354');
  expect(transactionQuery.CustomerEmail).toBe('frankdonga@ymail.com');
  expect(transactionQuery.BillPayment.BillerId).toBe('104');
  expect(transactionQuery.BillPayment.CustomerId1).toBe('0000000001');
});

test('it throws an error if an unknown transaction is queried', async () => {
  expect.assertions(4);

  try {
    await quickteller.queryTransaction('ejfrfnrjfnjrnf');
  } catch (err) {
    expect(err).toBeInstanceOf(QuicktellerError);
    expect(err.message).toMatch(/An error occured while querying transaction/);
    expect(err.quickteller_code).toBe(QUICKTELLER_DATA_NOT_FOUND);
    expect(err.description).toBe('Transaction not found');
  }
});
