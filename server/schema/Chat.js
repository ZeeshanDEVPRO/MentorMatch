import mongoose from 'mongoose';

// Define the Chat schema for real time chat
const ChatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Indexed for faster lookups
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    },
  ],
  lastMessage: {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
    },
    timestamp: {
      type: Date,
    },
  },
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;
