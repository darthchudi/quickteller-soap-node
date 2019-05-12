import soap, { Client } from 'soap';
import { promisify } from 'util';
import { Parser, Builder } from 'xml2js';
import _ from 'lodash';
import env from './env';
import QuicktellerError from './errors';
import { QUICKTELLER_SUCCESS } from './constants';

/**
 * Base quickteller class
 */
class Quickteller {
  /**
   * Quickteller SOAP client object
   */
  private client: Client;

  /**
   * Converts an XML string to a javascript object.
   */
  private toJSON: <T = any>(xml: string) => Promise<T>;

  /**
   * Converts a javascript object to an XML string
   */
  private toXML: (obj: object) => string;

  /**
   * Creates the quickteller SOAP client and the JSON & SOAP parsers for serializing and deserializng arguments and responses.
   */
  async init() {
    if (!env.quickteller_soap_url || !env.quickteller_terminal_id)
      throw new Error(
        'The following environment variables are required to initialize the Quickteller client: QUICKTELLER_SOAP_URL, QUICKTELLER_TERMINAL_ID'
      );

    // TODO: Review the implications of doing this
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const xmlParser = new Parser({ explicitArray: false, mergeAttrs: true });

    const jsonParser = new Builder({
      headless: true,
      renderOpts: {
        indent: '',
      },
    });

    this.toJSON = promisify(xmlParser.parseString);
    this.toXML = jsonParser.buildObject.bind(jsonParser);

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
   * Converts a javascript object `args` to an XML string and returns a JSON object that the `node-soap` can use to make a SOAP request that
   * Quickteller recognizes.
   * @param args The request arguments to be serialized to XML
   */
  private argumentBuilder(args: object) {
    const xml = this.toXML(args);
    return {
      xmlParams: `<![CDATA[${xml}]]>`,
    };
  }

  /**
   * Gets all the Quickteller methods available in the SOAP service.
   */
  getMethods() {
    return this.client.describe();
  }

  /**
   * Gets all billter categories.
   */
  async getBillerCategories() {
    this.isClientInitialized();
    //@ts-ignore
    const [rawResult] = await this.client.GetBillerCategoriesAsync();
    const { Response } = await this.toJSON(rawResult.GetBillerCategoriesResult);

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return Response.CategoryList;

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

    const _searchCriteria = {
      CategoryId,
      BillerId,
      ChannelId,
      BillerName,
      TerminalId: env.quickteller_terminal_id,
    };

    // Filter out undefined keys/props
    const SearchCriteria = _.pickBy(_searchCriteria, v => v !== undefined);

    const args = this.argumentBuilder({
      SearchCriteria,
    });

    //@ts-ignore
    const [rawResult] = await this.client.GetBillersAsync(args);
    const { Response } = await this.toJSON(rawResult.GetBillersResult);

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return Response.BillerList;

    throw new QuicktellerError(
      'An error occured while getting billers',
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

    const args = this.argumentBuilder({ SearchCriteria: { BillerId } });

    //@ts-ignore
    const [rawResult] = await this.client.GetBillerPaymentItemsAsync(args);
    const { Response } = await this.toJSON(
      rawResult.GetBillerPaymentItemsResult
    );

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return Response.PaymentItemList.PaymentItem;

    throw new QuicktellerError(
      'An error occured while getting biller payment items',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }

  /**
   * Gets newly added billers.
   */
  async getLatestBillers() {
    this.isClientInitialized();

    //@ts-ignore
    const [rawResult] = await this.client.GetLatestBillersAsync();
    const { Response } = await this.toJSON(rawResult.GetLatestBillersResult);

    if (Response.ResponseCode === QUICKTELLER_SUCCESS)
      return Response.BillerList;

    throw new QuicktellerError(
      'An error occured while getting latest billers',
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
    CustomerValidationField: string,
    WithDetails = true
  ) {
    this.isClientInitialized();

    const _args = {
      RequestDetails: {
        TerminalId: env.quickteller_terminal_id,
        Customer: [
          {
            PaymentCode,
            CustomerId,
            CustomerValidationField,
            WithDetails: WithDetails ? 'True' : 'False',
          },
        ],
      },
    };

    const args = this.argumentBuilder(_args);

    //@ts-ignore
    const [rawResult] = await this.client.ValidateCustomerAsync(args);
    const { Response } = await this.toJSON(rawResult.ValidateCustomerResult);

    const { ResponseCode, ResponseDescription, Customer } = Response;

    if (ResponseCode !== QUICKTELLER_SUCCESS)
      throw new QuicktellerError(
        'An error occured while attempting customer validation',
        ResponseCode,
        ResponseDescription
      );

    if (Customer.ResponseCode !== QUICKTELLER_SUCCESS)
      throw new QuicktellerError(
        `An error occured while validating ${CustomerValidationField} ${CustomerId}`,
        Customer.ResponseCode,
        Customer.ResponseDescription
      );

    return Customer;
  }
}

export default new Quickteller();
