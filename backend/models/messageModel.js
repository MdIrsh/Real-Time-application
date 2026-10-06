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
    default: ""
  },
  image: {
    type: String,
    default: null
  },
  audio: {
    type: String,
    default: null
  },
  audioDuration: {
    type: Number,
    default: 0
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