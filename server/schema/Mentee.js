import mongoose from 'mongoose';

const MenteeSchema = new mongoose.Schema({
  photo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  skills: {
    type: [String],
    required: true,
    validate: [arrayLimit, 'At least one skill is required'],
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  mentors: [
    {
      mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
      },
      connectedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  mentorshipRequests: [
    {
      mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  notifications: [
    {
      message: String,
      isRead: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

function arrayLimit(val) {
  return val.length > 0;
}

const Mentee = mongoose.model('Mentee', MenteeSchema);
export default Mentee;
