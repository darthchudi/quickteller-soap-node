import dotenv from 'dotenv';

dotenv.config();

export default {
  quickteller_soap_url: process.env.QUICKTELLER_SOAP_URL,
  quickteller_terminal_id: process.env.QUICKTELLER_TERMINAL_ID,
};