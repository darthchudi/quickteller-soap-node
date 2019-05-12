import soap, { Client } from 'soap';
import { promisify } from 'util';
import { Parser, Builder } from 'xml2js';
import _ from 'lodash';
import env from './env';
import QuicktellerError from './errors';

/**
 * Base quickteller class
 */
class Quickteller {
  private client: Client;
  private toJSON: <T = any>(xml: string) => Promise<T>;
  private toXML: any;

  /**
   * Creates the quickteller SOAP client and the JSON & SOAP parsers for serializing and deserializng arguments and responses.
   */
  async init() {
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
   * Gets all the Quickteller methods available in the SOAP service.
   */
  getMethods() {
    return this.client.describe();
  }

  /**
   * Converts a javascript object `args` to an XML string and returns a JSON object that the `node-soap` can use to make a SOAP request that
   * Quickteller recognizes.
   * @param args The request arguments to be serialized to XML
   */
  argumentBuilder(args: object) {
    const xml = this.toXML(args);
    return {
      xmlParams: `<![CDATA[${xml}]]>`,
    };
  }

  /**
   * Gets all billter categories.
   */
  async getBillerCategories() {
    this.isClientInitialized();
    //@ts-ignore
    const [rawResult] = await this.client.GetBillerCategoriesAsync();
    const { Response } = await this.toJSON(rawResult.GetBillerCategoriesResult);

    if (Response.ResponseCode === '90000') return Response.CategoryList;

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

    if (Response.ResponseCode === '90000') return Response.BillerList;

    throw new QuicktellerError(
      'An error occured while getting billers',
      Response.ResponseCode,
      Response.ResponseDescription
    );
  }
}

export default new Quickteller();
