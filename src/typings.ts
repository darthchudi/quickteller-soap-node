import { Client } from 'soap';

/**
 * Javascript bject with arbitrary keys and values
 */
export type Object<T = any> = { [key: string]: T };

/**
 * Async Quickteller soap method
 */
type AsyncSoapMethod = (args?: {
  xmlParams: string;
}) => Promise<[Object<string>, string, Object, string]>;

/**
 * Quickteller client
 */
export interface QuicktellerClient extends Client {
  /**
   * This method retrieves all the biller category types.
   */
  GetBillerCategoriesAsync: AsyncSoapMethod;

  /**
   * This method retrieves billers based on the supplied search criteria.
   */
  GetBillersAsync: AsyncSoapMethod;

  /**
   * This method retrieves newly added billers.
   */
  GetLatestBillersAsync: AsyncSoapMethod;

  /**
   * This method retrieves all the biller payment items.
   */
  GetBillerPaymentItemsAsync: AsyncSoapMethod;

  /**
   * This method is used to validate a list of customer ids/numbers. It takes
   * customer list and return customer list with the response code for each customer.
   */
  ValidateCustomerAsync: AsyncSoapMethod;

  /**
   * This method is used to notify the biller of the payment.
   */
  SendBillPaymentAdviceAsync: AsyncSoapMethod;

  /**
   * This method is used to retrieve the status of a transaction.
   */
  QueryTransactionAsync: AsyncSoapMethod;
}

/**
 * Base quickteller result
 */
export interface QuicktellerResult {
  ResponseCode: string;
  ResponseCodeGrouping: string;
  ResponseDescription?: string;
}

/**
 * Result gotten from the `GetBillerCategories` method
 */
export interface GetBillerCategoriesResult extends QuicktellerResult {
  CategoryList: {
    TotalAvailable: string;
    Category: {
      Id: string;
      Name: string;
      Description: string;
    }[];
  };
}

/**
 * Result gotten from the `GetBillers` method
 */
export interface GetBillersResult extends QuicktellerResult {
  BillerList: {
    count: string;
    Category: {
      id: string;
      name: string;
      Description: string;
      Biller: {
        Type: string;
        Id: string;
        PAYDirectProductId: string;
        Name: string;
        ShortName: string;
        Narration: string;
        CustomerField1: string;
        CustomerField2: string;
        LogoUrl: string;
        Url: string;
        Surcharge: string;
        CustomSectionUrl: string;
        CurrencyCode: string;
        CurrencySymbol: string;
        QuickTellerSiteUrlName: string;
        SupportEmail: string;
        CustomMessage: string;
        RiskCategoryId: string;
      }[];
    };
  };
}

/**
 * Result gotten from the `GetLatestBillers` method
 */
export interface GetLatestBillersResult extends QuicktellerResult {
  BillerList: {
    count: string;
    Category: {
      id: string;
      name: string;
      Description: string;
      Biller: {
        Id: string;
        Name: string;
        Narration: string;
        QuickTellerSiteUrlName: string;
        CustomMessage: string;
      }[];
    };
  };
}

/**
 * Result gotten from the `GetBillerPaymentItems` method
 */
export interface GetBillerPaymentItemsResult extends QuicktellerResult {
  PaymentItemList: {
    PaymentItem: {
      Id: string;
      Name: string;
      BillerName: string;
      ConsumerIdField: string;
      Code: string;
      BillerType: string;
      ItemFee: string;
      Amount: string;
      BillerId: string;
      BillerCategoryId: string;
      CurrencyCode: string;
      CurrencySymbol: string;
      ItemCurrencyCode: string;
      ItemCurrencySymbol: string;
      PaymentItemList: string;
      IsAmountFixed: string;
      SortOrder: string;
      PictureId: string;
      PictureGuid: string;
      PaymentCode: string;
      AmountType: string;
      PaydirectItemCode: string;
    }[];
  };
}

/**
 * Result gotten from the `ValidateCustomer` method
 */
export interface ValidateCustomerResult extends QuicktellerResult {
  Customer: {
    PaymentCode: string;
    CustomerId: string;
    WithDetails: string;
    ResponseCode: string;
    FullName: string;
    Address: string;
    DateOfBirth: string;
    Email: string;
    Lastname: string;
    Othernames: string;
    Phone: string;
    Title: string;
    SecConsumerId: string;
    PriConsumerId: string;
    Amount: string;
    AmountType: string;
    AmountTypeDescription: string;
    ResponseDescription?: string;
  };
}

/**
 * Result gotten from the `SendBillPaymentAdvice` method
 */
export interface SendBillPaymentAdviceResult extends QuicktellerResult {
  TransactionRef: string;
  ApprovedAmount: string;
}

/**
 * Result gotten from the `QueryTransaction` method
 */
export interface QueryTransactionResult extends QuicktellerResult {
  TransactionSet: string;
  TransactionResponseCode: string;
  Status: string;
}
