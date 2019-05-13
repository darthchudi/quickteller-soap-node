import { toXML } from '.';

/**
 * Converts a javascript object `args` to an XML string and returns a JSON object that can be used to make a SOAP request that
 * Quickteller recognizes.
 * @param args The request arguments to be serialized to XML
 */
export const buildArguments = (args: object) => {
  const xml = toXML(args);
  return {
    xmlParams: `<![CDATA[${xml}]]>`,
  };
};
