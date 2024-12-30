import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoMdNotifications } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { CiLogout } from "react-icons/ci";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("user") || document.cookie.includes("auth");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setIsLoggedIn(!!token);

    if (token) {
      fetchUserData();
      const intervalId = setInterval(fetchUserData, 10000); // Fetch every 10 seconds
      return () => clearInterval(intervalId);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser.email) return;

      const response = await fetch("https://mentormatch-ewws.onrender.com/syncdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedUser.email }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setUserData(data.user);
        console.log(data.user);
        setNotifications(data.user.notifications || []);
      } else {
        console.error("Error fetching user data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const toggleNotifications = () => setIsOpen(!isOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleAccept = async (notificationId) => {
    await handleNotificationAction(notificationId, "acceptMentorshipRequest");
  };

  const handleDecline = async (notificationId) => {
    await handleNotificationAction(notificationId, "declineMentorshipRequest");
  };

  const handleNotificationAction = async (notificationId, endpoint) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const { _id: userId, role } = storedUser;

      const response = await fetch(`https://mentormatch-ewws.onrender.com/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notificationId, isMentor: role === "mentor" }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      } else {
        console.error("Error handling notification");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <nav className="bg-gray-800 shadow-md py-4 px-4 sm:px-6 md:px-12 font-raleway relative">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-purple-600">MentorMatch®</Link>

        <div className="hidden md:flex gap-10">
          {(userData?.role === "mentor" || userData?.role === "mentee") &&  (
          <Link to="/about" className="text-white hover:text-blue-600">About</Link>
          )}
          {userData?.role === "mentor" && (
            <Link to="/mentees" className="text-white hover:text-blue-600">Mentees</Link>
          )}
          {userData?.role === "mentee" && (
            <Link to="/mentors" className="text-white hover:text-blue-600">Mentors</Link>
          )}
          {(userData?.role === "mentor" || userData?.role === "mentee") && (
            <Link to="/mentorship" className="text-white hover:text-blue-600">Mentorship</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <div className="relative">
                <IoMdNotifications
                  onClick={toggleNotifications}
                  className="text-2xl text-blue-700 hover:text-blue-500 cursor-pointer"
                />
                {isOpen && (
                  <div className="absolute top-10 right-0 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-10">
                    <h3 className="p-4 font-bold text-lg">Notifications</h3>
                    <ul>
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <li key={notif.id} className="py-2 px-4 text-sm border-b last:border-none">
                            {notif.message}
                          </li>
                        ))
                      ) : (
                        <li className="py-2 px-4 text-sm text-gray-600">No new notifications</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <Link to="/profile">
                <CgProfile className="text-2xl text-blue-700 hover:text-blue-500 cursor-pointer" />
              </Link>
              <CiLogout
                onClick={handleLogout}
                className="text-2xl text-red-600 hover:text-red-800 cursor-pointer"
              />
            </>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="px-4 py-2 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-700 hover:text-white">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Register
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden mt-4">
          <Link to="/about" className="block py-2 text-white hover:text-blue-600">About</Link>
          {isLoggedIn && (
            <>
              {userData?.role === "mentor" && (
                <Link to="/mentees" className="block py-2 text-white hover:text-blue-600">Mentees</Link>
              )}
              {userData?.role === "mentee" && (
                <Link to="/mentors" className="block py-2 text-white hover:text-blue-600">Mentors</Link>
              )}
              <Link to="/mentorship" className="block py-2 text-white hover:text-blue-600">Mentorship</Link>
            </>
          )}
          <div className="mt-4 border-t border-gray-700 pt-4">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="block py-2 text-white hover:text-blue-600">
                  <CgProfile className="mr-2 text-xl" /> Profile
                </Link>
                <button onClick={handleLogout} className="block py-2 text-white hover:text-red-500">
                  <CiLogout className="mr-2 text-xl" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-700 hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="block py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
