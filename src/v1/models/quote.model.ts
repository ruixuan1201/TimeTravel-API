import mongoose from 'mongoose';

import { TRADO_CODE, IQuote } from './../entities/quote';

const Quote = mongoose.model<IQuote>(
  'Quote',
  new mongoose.Schema(
    {
      serviceLevel: {
        tradoCode: {
          type: String,
          enum: Object.values(TRADO_CODE),
        },
        tradoName: String,
        terms: String,
        shipperCode: String,
      },
      amount: Number,
      currency: String,
      provider: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    {
      timestamps: true,
    },
  ),
);

export default Quote;
