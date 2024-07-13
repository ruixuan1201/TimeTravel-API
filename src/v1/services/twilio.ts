import twilio from 'twilio';
import * as dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sender = process.env.TWILIO_SENDER;
const client = twilio(accountSid, authToken);

export const sendSMS = async (body: string, to: string) => {
  if (process.env.NODE_ENV === 'PROD') {
    return new Promise((resolve, reject) => {
      return client.messages
        .create({
          body,
          from: sender,
          to,
        })
        .then((message) => resolve(message.sid))
        .catch((err) => reject(err));
    });
  } else return null;
};
