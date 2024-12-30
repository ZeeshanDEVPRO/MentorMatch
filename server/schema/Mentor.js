import mongoose from 'mongoose';

// define the schema for our mentor model
const MentorSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    default: 'mentor',
  },
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
  experience: {
    type: [String],
    required: true,
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  availability: {
    type: [String],
    default: ['Flexible'],
  },
  charges: {
    require: true,
    type: String,
  },
  mentees: {
    type: [String],
    default: [],
  },
  mentorshipRequests: [
    {
      menteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentee',
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
      mentorshipRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
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

const Mentor = mongoose.model('Mentor', MentorSchema);
export default Mentor;
