import mongoose from 'mongoose';

export interface IDispatcher {
  shipmentId: mongoose.Types.ObjectId;
  shipperId: mongoose.Types.ObjectId;
}

export interface IMatrixDistanceElement {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
  shipperId?: string;
}

export interface IMatrixDistance {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: {
    elements: IMatrixDistanceElement[];
  }[];
  status: string;
}
