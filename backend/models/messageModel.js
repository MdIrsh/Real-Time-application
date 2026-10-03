import mongoose from 'mongoose';

const messageModel = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  message: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  delivered: {
    type: Boolean,
    default: false
  },
  seen: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Message = mongoose.model('Message', messageModel);