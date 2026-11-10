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
    required: false,
    default: null
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
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
  file: {
    url: { type: String, default: "" },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
  },
  reactions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      emoji: {
        type: String,
        default: "👍",
      },
    }
  ],
  poll: {
    question: { type: String, default: "" },
    options: [
      {
        text: { type: String, default: "" },
        votes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          }
        ],
      }
    ],
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
    default: false
  },
  seen: {
    type: Boolean,
    default: false
  },
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    senderName: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
  }
}, { timestamps: true });

export const Message = mongoose.model('Message', messageModel);