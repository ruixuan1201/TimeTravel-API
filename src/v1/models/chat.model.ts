import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { IChat, RECIPIENT_TYPE } from '../entities/chat';

const ChatSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    recipientType: {
      type: String,
      enum: Object.values(RECIPIENT_TYPE),
    },
    message: String,
    channel: String,
    sender: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  },
);

const Chat = mongoose.model<IChat, mongoose.PaginateModel<IChat>>('Chat', ChatSchema.plugin(paginate));

export default Chat;
