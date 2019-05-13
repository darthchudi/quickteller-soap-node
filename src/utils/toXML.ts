import { Builder } from 'xml2js';

const builder = new Builder({
  headless: true,
  renderOpts: {
    indent: '',
  },
});

/**
 * Converts a javascript object to an XML string
 */
export const toXML = (obj: object) => builder.buildObject(obj);
