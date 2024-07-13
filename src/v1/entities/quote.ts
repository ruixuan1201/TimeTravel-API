import mongoose from 'mongoose';

export enum TRADO_CODE {
  WHITE_GLOVE = 'WHITE_GLOVE',
  SPEED = 'SPEED',
  ECONOMY = 'ECONOMY',
}

export interface IQuote {
  shipmentId: mongoose.Types.ObjectId;
  serviceLevel: {
    tradoCode: TRADO_CODE;
    tradoName: string;
    terms: string;
    shipperCode: string;
  };
  amount: number;
  currency: string;
  provider: mongoose.Types.ObjectId;
}
