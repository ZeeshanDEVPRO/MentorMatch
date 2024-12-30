// importing required modules
import 'dotenv/config';
import express from 'express';
import { json } from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import Mentor from './schema/Mentor.js';
import Mentee from './schema/Mentee.js';
import Chat from './schema/Chat.js';
import Message from './schema/Message.js';
import './db/config.js';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 5001;
const jwtKey = process.env.JWT_KEY || 'makematch'; // Using an environment variable for security

// Cloudinary configuration for image upload
cloudinary.config({
  cloud_name: process.env.CLOUD,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// Middlewares for JSON, CORS, and file upload
app.use(json());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(fileUpload({ useTempFiles: true }));

// Create HTTP server and WebSocket server
const server = http.createServer(app);

// WebSocket server initialization
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log("WebSocket connected");

  // Handle incoming messages
  ws.on('message', async (message) => {
    const { type, roomId, senderId, text } = JSON.parse(message);

    if (type === 'joinRoom') {
      // Check if roomId is valid
      if (!roomId) {
        console.error('Invalid roomId received');
        return;
      }

      try {
        ws.roomId = roomId; // Store roomId in WebSocket connection
        console.log(`WebSocket joined room: ${roomId}`);
        // Fetch and send chat history if roomId is valid
        const messages = await Message.find({ chatId: roomId }).sort({ timestamp: 1 });
        ws.send(JSON.stringify({ type: 'chatHistory', messages }));
      } catch (error) {
        console.error("Error joining room:", error.message);
      }
    }

    if (type === 'sendMessage') {
      // Handle sending message logic
      if (!roomId || !senderId || !text) {
        console.error("Invalid message payload");
        return;
      }

      try {
        console.log(text)
        // Save message to database logic
        const newMessage = new Message({
          chatId: roomId,
          senderId,
          text,
        });
        await newMessage.save();

        // Broadcast message to all clients in the room
        const messageToSend = {
          chatId: roomId,
          senderId,
          text,
          timestamp: newMessage.timestamp,
        };

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === client.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify({ type: 'receiveMessage', roomId: roomId, senderId, text, timestamp: newMessage.timestamp, }));
          }
        });
      } catch (error) {
        console.error("Error sending message:", error.message);
      }
    }
  });
});

// API for mentee to connect with a mentor
app.post('/connectmentor', async (req, res) => {
  try {
    const { mentorId, menteeId } = req.body;

    // Validate input
    if (!mentorId || !menteeId) {
      return res.status(400).json({ error: 'Mentor ID and Mentee ID are required.' });
    }

    // Search for mentor using ID
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    // Update status for the mentee
    mentor.status.set(menteeId, 'requested');
    await mentor.save();

    return res.status(200).json({ message: 'Request sent to mentor.', status: mentor.status.get(menteeId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// API for mentor to respond to a mentee connection request
app.post('/respondmentor', async (req, res) => {
  try {
    const { mentorId, menteeId, action } = req.body;

    // Validate input
    if (!mentorId || !menteeId || !['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ error: 'Mentor ID, Mentee ID, and valid action (accepted/declined) are required.' });
    }

    // Search for mentor using ID
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    // Check if there is an existing request
    const currentStatus = mentor.status.get(menteeId);
    if (!currentStatus || currentStatus !== 'requested') {
      return res.status(400).json({ error: 'No pending request found for this mentee.' });
    }

    // Update status based on the action
    mentor.status.set(menteeId, action);
    await mentor.save();

    return res.status(200).json({ message: `Mentee request ${action}.`, status: mentor.status.get(menteeId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// API to connect a mentee with a mentor
app.post('/connectmentee', async (req, res) => {
  try {
    const { mentorId, menteeId } = req.body;

    // Validate input
    if (!mentorId || !menteeId) {
      return res.status(400).json({ menteeId, mentorId, error: 'Mentor ID and Mentee ID are required.' });
    }

    // Validate MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(mentorId) || !mongoose.Types.ObjectId.isValid(menteeId)) {
      return res.status(400).json({ menteeId, mentorId, error: 'Invalid Mentor ID or Mentee ID.' });
    }

    // Find the mentor in the database
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    // Check if status is already set for the mentee
    const existingRequest = mentor.mentorshipRequests.find(
      request => request.menteeId.toString() === menteeId
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already exists for this mentee.' });
    }

    // Add new mentorship request
    mentor.mentorshipRequests.push({
      menteeId: menteeId,
      status: 'pending'
    });

    // Add notification for the mentor
    mentor.notifications.push({
      message: `New mentorship request from mentee ${menteeId}`,
      isRead: false
    });

    await mentor.save();

    // Return success response
    return res.status(200).json({
      message: 'Request sent to mentor.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error in /connectmentee:', error.message);
    return res.status(500).json({
      error: 'Internal server error.',
      details: error.message
    });
  }
});

// API for mentee to respond to a mentor connection request
app.post('/respondmentee', async (req, res) => {
  try {
    const { mentorId, menteeId, action } = req.body;

    // Validate input
    if (!mentorId || !menteeId || !['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ error: 'Mentor ID, Mentee ID, and valid action (accepted/declined) are required.' });
    }

    // Search for mentor using ID
    const mentee = await Mentee.findById(menteeId);
    if (!mentee) {
      return res.status(404).json({ error: 'Mentee not found.' });
    }

    // Check if there is an existing request
    const currentStatus = mentee.status.get(mentorId);
    if (!currentStatus || currentStatus !== 'requested') {
      return res.status(400).json({ error: 'No pending request found for this mentee.' });
    }

    // Update status based on the action
    mentee.status.set(mentorId, action);
    await mentee.save();

    return res.status(200).json({ message: `Mentee request ${action}.`, status: mentee.status.get(mentorId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Helper function for user queries
const getUsers = async (model, query, resp) => {
  try {
    const users = await model.find(query);
    resp.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    resp.status(500).send({ error: "Something went wrong" });
  }
};

// API for photo upload
app.post('/photo_upload', async (req, res) => {
  const photo = req.files.photo;
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validImageTypes.includes(photo.mimetype)) {
    return res.status(400).json({ error: 'Uploaded file is not a valid image.' });
  }

  // Upload photo to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(photo.tempFilePath);
  res.status(201).json({ photo_url: uploadResult.secure_url });


})

// Register API
app.post('/register', async (req, res) => {
  try {
    const { type, name, email, mobile, password, photo_url, skills, experience, availability, charges, bio } = req.body;
    const photourl = req.body.photo_url;

    // Validate required fields
    if (!type || !name || !email || !mobile || !password || !skills) {
      return res.status(400).json({ error: 'All fields are required, including at least one skill.' });
    }

    // Parse skills and experience
    const parsedSkills = Object.values(skills);
    const parsedExperience = type === 'mentor' ? Object.values(experience) : [];

    // Check if skills array is empty
    if (parsedSkills.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required.' });
    }

    // Check if the email or mobile is already registered
    const existingUser = await Mentor.findOne({ email }) || await Mentee.findOne({ email }) ||
      await Mentor.findOne({ mobile }) || await Mentee.findOne({ mobile });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or Mobile is already registered.' });
    }

    // Validate user type
    const UserModel = type === 'mentor' ? Mentor : type === 'mentee' ? Mentee : null;
    if (!UserModel) {
      return res.status(400).json({ error: 'Invalid user type.' });
    }

    // Hash password
    const hashedPassword = await hash(password, 9);

    // Create and save user
    const user = new UserModel({
      name,
      email,
      mobile,
      bio,
      password: hashedPassword,
      skills: parsedSkills,
      role: type,
      type,
      ...(type === 'mentor' && { experience: parsedExperience, availability, charges }), // Include mentor-specific fields
      photo: photo_url, // Use secure URL from Cloudinary
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: savedUser._id, type }, jwtKey, { expiresIn: '26h' });

    res.status(201).json({ user: savedUser, auth: token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Login API
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate identifier format (email or mobile)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;

    const fieldName = emailRegex.test(identifier)
      ? 'email'
      : mobileRegex.test(identifier)
        ? 'mobile'
        : null;

    if (!fieldName) {
      return res.status(400).json({ error: "Invalid identifier format. Use a valid email or mobile number." });
    }

    // Find user in Mentor or Mentee collections
    const user =
      await Mentor.findOne({ [fieldName]: identifier }) ||
      await Mentee.findOne({ [fieldName]: identifier });

    // Check if user exists and password is correct
    if (!user || !(await compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email/mobile or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, type: user instanceof Mentor ? 'mentor' : 'mentee' },
      jwtKey,
      { expiresIn: "26h" }
    );

    // Send user data and token
    res.status(200).json({ user, auth: token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error. Please try again later.", details: error.message });
  }
});


// Get all mentors API
app.get('/allmentors', async (req, resp) => {
  try {
    const mentors = await Mentor.find();
    resp.send(mentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    resp.status(500).send({ error: "Something went wrong" });
  }
});

// Get all mentees API
app.get('/allmentees', async (req, resp) => {
  try {
    const mentees = await Mentee.find();
    resp.send(mentees);
  } catch (error) {
    console.error("Error fetching mentees:", error);
    resp.status(500).send({ error: "Something went wrong" });
  }
});

// Get mentor by ID, skill, name, or email
app.get('/mentor', (req, resp) => {
  const { id, skill, name, email } = req.query;
  const query = {
    ...(id && { _id: id }),
    ...(skill && { skills: { $regex: skill, $options: 'i' } }),
    ...(name && { name: { $regex: name, $options: 'i' } }),
    ...(email && { email }),
  };
  getUsers(Mentor, query, resp);
});

// Get mentee by ID, skill, name, or email
app.get('/mentee', (req, resp) => {
  const { id, skill, name, email } = req.query;
  const query = {
    ...(id && { _id: id }),
    ...(skill && { skills: { $regex: skill, $options: 'i' } }),
    ...(name && { name: { $regex: name, $options: 'i' } }),
    ...(email && { email }),
  };
  getUsers(Mentee, query, resp);
});

// Delete user by ID (mentor or mentee)
app.delete('/user/:id', async (req, resp) => {
  try {
    const { id } = req.params;
    const deletedUser = await Mentor.findByIdAndDelete(id) || await Mentee.findByIdAndDelete(id);
    if (!deletedUser) {
      return resp.status(404).send({ error: "User not found" });
    }
    resp.send({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    resp.status(500).send({ error: "Something went wrong" });
  }
});

// Update user by ID (mentor or mentee)
app.put('/update/:id', async (req, resp) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handling skills and experience arrays
    if (updateData.skills) {
      updateData.skills = updateData.skills.filter(skill => skill !== "");
    }
    if (updateData.experience) {
      updateData.experience = updateData.experience.filter(exp => exp !== "");
    }

    const updatedUser = await Mentor.findByIdAndUpdate(id, updateData, { new: true }) ||
      await Mentee.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return resp.status(404).send({ error: "User not found" });
    }
    resp.send(updatedUser);
  } catch (error) {
    console.error(error);
    resp.status(500).send({ error: "Something went wrong" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
