import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import PrivateComponent from './components/PrivateComponent';

// Importing Pages
import Home from './pages/Home';
import Login from './pages/Login';
import ProfileSetUp from './pages/ProfileSetUp';
import Register from './pages/Register';
import About from './pages/About';
import Mentee from './pages/Mentee';
import Mentor from './pages/Mentor';
import Mentorship from './pages/Mentorship';
import Chat from './pages/Chat';
// import Test from './pages/Test';

function App() {
  return (
    <BrowserRouter>
      <div className="App">

        {/* describing Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path='/mentees' element={<Mentee />} />
          <Route path='/mentors' element={<Mentor />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/test" element={<Test />} /> */}
          <Route path="/about" element={<About />} />

          {/* using private component to protect routes, visible only after login */}
          <Route element={<PrivateComponent />}>
            <Route path='/mentorship' element={<Mentorship />} />
            <Route path="/profile" element={<ProfileSetUp />} />
            <Route path="/chat" element={<Chat />} />

            <Route path="/chat">
              <Route path=":roomId" element={<Chat />} />
            </Route>
          </Route>
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;
