import soap from 'soap';
import env from './env';
import QuicktellerError from './errors';
import { QUICKTELLER_SUCCESS } from './constants';
import {
  toJSON,
  removeEmptyFields,
  buildArguments,
  generateReference,
  toArray,
} from './utils';
import {
  QuicktellerClient,
  GetBillerCategoriesResult,
  GetBillersResult,
  GetLatestBillersResult,
  GetBillerPaymentItemsResult,
  ValidateCustomerResult,
  SendBillPaymentAdviceResult,
  QueryTransactionResult,
} from 'typings';

/**
 * Base quickteller class
 */
class Quickteller {
  /**
   * Quickteller SOAP client object
   */
  private client: QuicktellerClient;

  /**
   * Creates the quickteller SOAP client
   * @param requestPrefix 4 digit request prefix provided by Interswitch
   */
  async init() {
    if (
      !env.quickteller_soap_url ||
      !env.quickteller_terminal_id ||
      !env.quickteller_request_prefix
    )
      throw new Error(
        `The following environment variables are required to initialize the Quickteller client: QUICKTELLER_SOAP_URL, 
        QUICKTELLER_TERMINAL_ID, QUICKTELLER_REQUEST_PREFIX`
      );

    // TODO: Review the implications of doing this
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    this.client = await soap.createClientAsync(
      `${env.quickteller_soap_url}?wsdl`,
      { endpoint: env.quickteller_soap_url }
    );
  }

  /**
   * Checks if the Quickteller SOAP client has been initialized
   */
  private isClientInitialized() {
    if (!this.client)
      throw new Error(
        'Please initialize the Quickteller client first by calling `.init()`'
      );
  }

  /**
   * Gets all the Quickteller methods available in the SOAP service.
   */
  getMethods() {
    return this.client.describe();
  }

  /**
   * Gets all biller categories.
   */
  async getBillerCategories() {
    this.isClientInitialized();

    const [rawResult] = await this.client.GetBillerCategoriesAsync();

    const { Response } = await toJSON<GetBillerCategoriesResult>(
      rawResult.GetBillerCategoriesResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return Response.CategoryList.Category;

    throw new QuicktellerError(
      'An error occured while getting biller categories',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Gets all billers within a particular category
   * @param CategoryId Id of the category the biller belongs to
   * @param BillerId The biller's id
   * @param ChannelId Id of channel that the biller is enabled on.
   * @param BillerName All or part of the biller’s name
   */
  async getBillers(
    CategoryId?: number | string,
    BillerId?: number | string,
    ChannelId?: number | string,
    BillerName?: string
  ) {
    this.isClientInitialized();

    // Filter out undefined keys/props
    const SearchCriteria = removeEmptyFields({
      CategoryId,
      BillerId,
      ChannelId,
      BillerName,
      TerminalId: env.quickteller_terminal_id,
    });

    const args = buildArguments({
      SearchCriteria,
    });

    const [rawResult] = await this.client.GetBillersAsync(args);

    const { Response } = await toJSON<GetBillersResult>(
      rawResult.GetBillersResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return toArray(Response.BillerList.Category.Biller);

    throw new QuicktellerError(
      'An error occured while getting billers',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Gets newly added billers.
   */
  async getLatestBillers() {
    this.isClientInitialized();

    const [rawResult] = await this.client.GetLatestBillersAsync();

    const { Response } = await toJSON<GetLatestBillersResult>(
      rawResult.GetLatestBillersResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return toArray(Response.BillerList.Category.Biller);

    throw new QuicktellerError(
      'An error occured while getting latest billers',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Gets all of a biller's payment items
   * @param BillerId The biller's id
   */
  async getBillerPaymentItems(BillerId: number | string) {
    this.isClientInitialized();

    const args = buildArguments({ SearchCriteria: { BillerId } });

    const [rawResult] = await this.client.GetBillerPaymentItemsAsync(args);

    const { Response } = await toJSON<GetBillerPaymentItemsResult>(
      rawResult.GetBillerPaymentItemsResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return toArray(Response.PaymentItemList.PaymentItem);

    throw new QuicktellerError(
      'An error occured while getting biller payment items',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Validates a customer's details for a particular bill payment e.g DSTV decoder number is provided
   * to validate DSTV subscription payment.
   * @param PaymentCode The payment code of the bill
   * @param CustomerId The customer's id for the `CustomerValidationField` e.g DSTV decoder number
   * @param CustomerValidationField The name of the field to validate the customer's id against e.g `Decoder Number`
   * @param WithDetails Whether to return the customer's details if found. Defaults to `true`
   */
  async validateCustomer(
    PaymentCode: string | number,
    CustomerId: string | number,
    CustomerValidationField?: string,
    WithDetails = true
  ) {
    this.isClientInitialized();

    // Filter out undefined keys/props
    const customerParams = removeEmptyFields({
      PaymentCode,
      CustomerId,
      CustomerValidationField,
      WithDetails: WithDetails ? 'True' : 'False',
    });

    const RequestDetails = {
      TerminalId: env.quickteller_terminal_id,
      Customer: customerParams,
    };

    const args = buildArguments({ RequestDetails });

    const [rawResult] = await this.client.ValidateCustomerAsync(args);

    const { Response } = await toJSON<ValidateCustomerResult>(
      rawResult.ValidateCustomerResult
    );

    const { ResponseCode, ResponseDescription, Customer } = Response;

    if (ResponseCode !== QUICKTELLER_SUCCESS)
      throw new QuicktellerError(
        'An error occured while attempting customer validation',
        ResponseCode,
        ResponseDescription
      );

    if (Customer.ResponseCode !== QUICKTELLER_SUCCESS)
      throw new QuicktellerError(
        `An error occured while validating ${
          CustomerValidationField ? CustomerValidationField : 'customer id'
        } ${CustomerId}`,
        Customer.ResponseCode,
        Customer.ResponseDescription
      );

    return Customer;
  }

  /**
   * Notifies the biller of the payment
   * @returns The quickteller response and the automatically generated `RequestReference`
   */
  async sendBillPaymentAdvice(
    Amount: number,
    PaymentCode: string | number,
    CustomerId: string | number,
    CustomerMobile?: string,
    CustomerEmail?: string
  ) {
    this.isClientInitialized();

    const reference = await generateReference(8);

    // Filter out undefined keys/props
    const BillPaymentAdvice = removeEmptyFields({
      Amount,
      PaymentCode,
      CustomerId,
      CustomerMobile,
      CustomerEmail,
      TerminalId: env.quickteller_terminal_id,
      RequestReference: `${env.quickteller_request_prefix}${reference}`,
    });

    const args = buildArguments({ BillPaymentAdvice });

    const [rawResult] = await this.client.SendBillPaymentAdviceAsync(args);

    const { Response } = await toJSON<SendBillPaymentAdviceResult>(
      rawResult.SendBillPaymentAdviceResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return {
        ...Response,
        RequestReference: BillPaymentAdvice.RequestReference,
      };

    throw new QuicktellerError(
      'An error occured while sending bill payment advice',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Retrieves the status of a transaction
   * @param RequestReference Unique request reference returned by the `sendBillPaymentAdvice` method
   */
  async queryTransaction(RequestReference: string) {
    this.isClientInitialized();

    const args = buildArguments({ RequestDetails: { RequestReference } });

    const [rawResult] = await this.client.QueryTransactionAsync(args);

    const { Response } = await toJSON<QueryTransactionResult>(
      rawResult.QueryTransactionResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS) return Response;

    throw new QuicktellerError(
      'An error occured while querying transaction',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }
}

export default new Quickteller();
