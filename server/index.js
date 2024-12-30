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
import mongoose from 'mongoose';

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

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket server initialization
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log("WebSocket connected");

    // Handle incoming messages
    ws.on('message', async (message) => {
        const { type, roomId, senderId, text } = JSON.parse(message);

        if (type === 'joinRoom') {
            if (!roomId) {
                console.error('Invalid roomId received');
                return;
            }

            try {
                ws.roomId = roomId;
                console.log(`WebSocket joined room: ${roomId}`);
                
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
                const newMessage = new Message({
                    chatId: roomId,
                    senderId,
                    text,
                });
                await newMessage.save();


                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === client.OPEN && client.roomId === roomId) {
                        client.send(JSON.stringify({ type: 'receiveMessage', roomId: roomId,senderId,text,timestamp: newMessage.timestamp, }));
                    }
                });
            } catch (error) {
                console.error("Error sending message:", error.message);
            }
        }
    });
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

// Get mentor by ID, skill, name, or email
app.get('/getmentor', (req, resp) => {
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
app.get('/getmentee', (req, resp) => {
  const { id, skill, name, email } = req.query;
  const query = {
    ...(id && { _id: id }),
    ...(skill && { skills: { $regex: skill, $options: 'i' } }),
    ...(name && { name: { $regex: name, $options: 'i' } }),
    ...(email && { email }),
  };
  getUsers(Mentee, query, resp);
});

// API for photo upload
app.post('/photo_upload', async (req,res) =>{
    const photo = req.files.photo;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(photo.mimetype)) {
      return res.status(400).json({ error: 'Uploaded file is not a valid image.' });
    }

    // Upload photo to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(photo.tempFilePath);
    res.status(201).json({ photo_url: uploadResult.secure_url });
})

// function to sync data
app.post('/syncdata', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        // Find user in Mentor or Mentee collections
        const user =
            await Mentor.findOne({ email }).select('-password') || // Exclude the password field
            await Mentee.findOne({ email }).select('-password'); // Exclude the password field

        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Return user data
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).json({ error: "Internal server error. Please try again later.", details: error.message });
    }
});

// sends request for mentorship
app.post('/sendMentorshipRequest', async (req, res) => {
  const { request_to, request_from } = req.body; // Getting request_to and request_from from the request body

  // Validate request_to and request_from
  if (!request_to || !request_from) {
    return res.status(400).json({ error: 'request_to and request_from are required' });
  }

  try {
    // Check if the request_to is a Mentor or Mentee
    const isMentor = await Mentor.findById(request_to);
    const isMentee = await Mentee.findById(request_to);

    if (isMentor) {
      // Fetch mentee's name
      const mentee = await Mentee.findById(request_from).select('name -_id');
      if (!mentee) {
        return res.status(404).json({ error: 'Mentee not found' });
      }
      const menteeName = mentee.name;

      // Check if mentorship request already exists
      const existingRequest = isMentor.mentorshipRequests.some(
        (request) =>
          request.menteeId.toString() === request_from.toString() && request.status === 'pending'
      );

      if (!existingRequest) {
        // Add mentorship request if not exists
        const mentorshipRequest = {
          menteeId: request_from,
          status: 'pending',
          requestedAt: new Date(),
        };

        const updatedMentor = await Mentor.findByIdAndUpdate(
          request_to,
          {
            $push: {
              mentorshipRequests: mentorshipRequest,
            },
          },
          { new: true, fields: { 'mentorshipRequests._id': 1 } }
        );

        const requestId =
          updatedMentor.mentorshipRequests[updatedMentor.mentorshipRequests.length - 1]._id;

        // Add a notification for the mentorship request
        await Mentor.updateOne(
          { _id: request_to },
          {
            $push: {
              notifications: {
                message: `You have a new mentorship request from Mentee name: ${menteeName}`,
                isRead: false,
                mentorshipRequestId: requestId,
                createdAt: new Date(),
              },
            },
          }
        );
      }
    } else if (isMentee) {
      // Fetch mentor's name
      const mentor = await Mentor.findById(request_from).select('name -_id');
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found' });
      }
      const mentorName = mentor.name;

      // Check if mentorship request already exists
      const existingRequest = isMentee.mentorshipRequests.some(
        (request) =>
          request.mentorId.toString() === request_from.toString() && request.status === 'pending'
      );

      if (!existingRequest) {
        // Add mentorship request if not exists
        const mentorshipRequest = {
          mentorId: request_from,
          status: 'pending',
          requestedAt: new Date(),
        };

        const updatedMentee = await Mentee.findByIdAndUpdate(
          request_to,
          {
            $push: {
              mentorshipRequests: mentorshipRequest,
            },
          },
          { new: true, fields: { 'mentorshipRequests._id': 1 } }
        );

        const requestId =
          updatedMentee.mentorshipRequests[updatedMentee.mentorshipRequests.length - 1]._id;

        // Add a notification for the mentorship request
        await Mentee.updateOne(
          { _id: request_to },
          {
            $push: {
              notifications: {
                message: `You have a new mentorship request from Mentor name: ${mentorName}`,
                isRead: false,
                mentorshipRequestId: requestId,
                createdAt: new Date(),
              },
            },
          }
        );
      }
    } else {
      return res.status(404).json({
        error: 'Invalid request_to: Not found in Mentor or Mentee collections',
      });
    }

    // Send success response
    res.json({ message: 'Mentorship request sent successfully' });
  } catch (error) {
    console.error('Error processing mentorship request:', error.message);
    res
      .status(500)
      .json({ error: 'An error occurred while processing the mentorship request' });
  }
});


  
// Register API
app.post('/register', async (req, res) => {
    try {
      const { type, name, email, mobile, password,photo_url, skills, experience, availability, charges,bio } = req.body;
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
        role:type,
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

// accepts request for mentorship
  app.post('/acceptMentorshipRequest', async (req, res) => {
    const { userId, requestId, isMentor } = req.body;
  
    if (!userId || !requestId || isMentor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // Find the user (mentor or mentee) based on the role
      const user = isMentor ? await Mentor.findById(userId) : await Mentee.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      // Find the mentorship request
      const request = user.mentorshipRequests.find(req => req._id.toString() === requestId);
      if (!request) return res.status(404).json({ error: 'Mentorship request not found' });
  
      // Determine the opposite user (mentor or mentee)
      const oppositeUserId = isMentor ? request.menteeId : request.mentorId;
      const oppositeUser = isMentor
        ? await Mentee.findById(oppositeUserId)
        : await Mentor.findById(oppositeUserId);
  
      if (!oppositeUser) return res.status(404).json({ error: 'Opposite user not found' });
  
      // Add the user to the opposite user's mentees/mentors array and vice versa
      if (isMentor) {
        if (!user.mentees.includes(oppositeUser._id)) user.mentees.push(oppositeUser._id);
        if (!oppositeUser.mentors.includes(user._id)) oppositeUser.mentors.push(user._id);
      } else {
        if (!user.mentors.includes(oppositeUser._id)) user.mentors.push(oppositeUser._id);
        if (!oppositeUser.mentees.includes(user._id)) oppositeUser.mentees.push(user._id);
      }
  
      // Remove the mentorship request from the user's `mentorshipRequests` array
      user.mentorshipRequests = user.mentorshipRequests.filter(req => req._id.toString() !== requestId);
  
      // Remove the related notification, if any
      user.notifications = user.notifications.filter(
        notif => !notif.message.includes(requestId)
      );
  
      // Save both users
      await Promise.all([user.save(), oppositeUser.save()]);
  
      res.status(200).json({ message: 'Mentorship request accepted and processed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing the request' });
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

// status update in mentor
app.post('/mentor', async (req, resp) => {
  const { userId } = req.body; 
  try {
    // Fetch all mentors
    const mentors = await Mentor.find();

    // Find the mentee by userId
    const mentee = await Mentee.findById(userId);

    // Check if the mentee exists
    if (!mentee) {
      return resp.status(404).json({ error: 'Mentee not found' });
    }

    // Now, iterate through all mentors and check mentorship request status
    const mentorsWithStatus = mentors.map((mentor) => {
      const request = mentor.mentorshipRequests.find(
        (req) => req.menteeId.toString() === userId
      );
      return {
        ...mentor._doc,
        requestStatus: request ? request.status : 'no_request', // Add request status (pending, accepted, declined, or no_request)
      };
    });

    // Return the mentors with mentorship request status
    resp.status(200).json(mentorsWithStatus);
  } catch (error) {
    console.error('Error fetching mentors:', error.message || error);
    resp.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// handles request 
app.put('/request/:role/:userId/:requestId', async (req, res) => {
  const { role, userId, requestId } = req.params;
  const { action } = req.body;

  console.log('Incoming Request:');
  console.log('Role:', role);
  console.log('User ID:', userId);
  console.log('Request ID:', requestId);
  console.log('Action:', action);

  if (!['accepted', 'declined'].includes(action)) {
    console.log('Invalid Action:', action);
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    // Determine the model based on the role
    const userModel = role === 'mentee' ? Mentee : Mentor;
    console.log('Using Model:', role === 'mentee' ? 'Mentee' : 'Mentor');

    // Fetch the user from the database
    const user = await userModel.findById(userId);
    console.log('User fetched:', user);

    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Debugging mentorship requests
    console.log('Mentorship Requests:', user.mentorshipRequests);

    // Find the mentorship request
    const mid = role === 'mentee' ? 'mentorId' : 'menteeId';
    let mentorshipRequest;

    console.log('Comparing requestId:', requestId);  // Log requestId for debugging
    console.log('Mentorship Requests:', user.mentorshipRequests);

    if (role === 'mentee') {
      mentorshipRequest = user.mentorshipRequests.find(
        (request) => request.mentorId.equals(new mongoose.Types.ObjectId(requestId))
      );
    } else if (role === 'mentor') {
      mentorshipRequest = user.mentorshipRequests.find(
        (request) => request.menteeId.equals(new mongoose.Types.ObjectId(requestId))
      );
    }

    if (!mentorshipRequest) {
      console.log('Mentorship request not found for Request ID:', requestId);
      console.log('Existing mentorship requests:', user.mentorshipRequests);
      return res.status(404).json({ message: 'Mentorship request not found' });
    }

    console.log('Mentorship Request Found:', mentorshipRequest);

    // Update the status
    mentorshipRequest.status = action;
    console.log('Updating mentorship request status to:', action);

    // When action is 'accepted', update the mentee's and mentor's arrays
    if (action === 'accepted') {
      if (role === 'mentee') {
        const mentor = await Mentor.findById(requestId);
        if (mentor) {
          // Add mentor ID to the mentee's mentors array
          user.mentors.push(mentor._id);
          console.log('Added mentor to mentee\'s mentors array:', mentor._id);

          // Add mentee ID to the mentor's mentees array
          mentor.mentees.push(user._id);
          console.log('Added mentee to mentor\'s mentees array:', user._id);

          // Save the mentor with updated mentees array
          await mentor.save();
          console.log('Mentor saved successfully with updated mentees array');
        }
      } else if (role === 'mentor') {
        const mentee = await Mentee.findById(requestId);
        if (mentee) {
          // Add mentee ID to the mentor's mentees array
          user.mentees.push(mentee._id);
          console.log('Added mentee to mentor\'s mentees array:', mentee._id);

          // Add mentor ID to the mentee's mentors array
          mentee.mentors.push(user._id);
          console.log('Added mentor to mentee\'s mentors array:', user._id);

          // Save the mentee with updated mentors array
          await mentee.save();
          console.log('Mentee saved successfully with updated mentors array');
        }
      }
    }

    // Create the notification message for the opposite user
    const notificationMessage = role === 'mentee' 
      ? `Your mentorship request with Mentee ${user.name} has been ${action}.`
      : `Your mentorship request with Mentor ${user.name} has been ${action}.`;

    // Create the notification object
    const notification = {
      message: notificationMessage,
      isRead: false,
      mentorshipRequestId: mentorshipRequest._id,
      createdAt: new Date(),
    };

    // Find the opposite user (mentor for mentee or mentee for mentor)
    let oppositeUser;
    if (role === 'mentee') {
      oppositeUser = await Mentor.findById(requestId);  // Find mentor if role is mentee
    } else if (role === 'mentor') {
      oppositeUser = await Mentee.findById(requestId);  // Find mentee if role is mentor
    }

    // Add the notification to the opposite user's notifications array
    if (oppositeUser) {
      oppositeUser.notifications.push(notification);
      console.log('Notification added to opposite user:', oppositeUser);

      // Save the opposite user with the updated notifications
      await oppositeUser.save();
      console.log('Opposite user saved successfully with notification.');
    }

    // Save the user with the updated request and notification
    await user.save();
    console.log('User saved successfully with updated request and notification.');

    return res.status(200).json({ message: `Mentorship request ${action} successfully.` });
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// handles mentorship
app.post('/mentorship/details/:role/:userId', async (req, res) => {
  const { role, userId } = req.params;
  const { ids } = req.body; // List of accumulated mentorIds or menteeIds
  let users;

  try {
    if (role === 'mentor') {
      // Fetch details of mentees for a mentor
      users = await Mentee.find({ _id: { $in: ids } }); // Find mentees by IDs
      if (!users.length) {
        return res.status(404).json({ message: 'Mentees not found' });
      }
      res.json({ menteeDetails: users });
    } else if (role === 'mentee') {
      // Fetch details of mentors for a mentee
      users = await Mentor.find({ _id: { $in: ids } }); // Find mentors by IDs
      if (!users.length) {
        return res.status(404).json({ message: 'Mentors not found' });
      }
      res.json({ mentorDetails: users });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
  } catch (error) {
    console.error('Error fetching mentorship details:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// status update in mentee
app.post('/mentee', async (req, resp) => {
  const { userId } = req.body; 
  try {
    // Fetch all mentees
    const mentees = await Mentee.find();

    // Find the mentor by userId
    const mentor = await Mentor.findById(userId);

    // Check if the mentor exists
    if (!mentor) {
      return resp.status(404).json({ error: 'Mentor not found' });
    }

    // Now, iterate through all mentees and check mentorship request status
    const menteesWithStatus = mentees.map((mentee) => {
      const request = mentee.mentorshipRequests.find(
        (req) => req.mentorId.toString() === userId
      );
      return {
        ...mentee._doc,
        requestStatus: request ? request.status : 'no_request', // Add request status (pending, accepted, declined, or no_request)
      };
    });

    // Return the mentees with mentorship request status
    resp.status(200).json(menteesWithStatus);
  } catch (error) {
    console.error('Error fetching mentees:', error.message || error);
    resp.status(500).json({ error: 'Failed to fetch mentees' });
  }
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
