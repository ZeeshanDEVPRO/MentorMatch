import React, { useState, useEffect } from "react";
import { CgPlayButtonO } from "react-icons/cg";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const ProfileSetUp = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    skills: ["", "", ""],
    experience: ["", "", ""],
    availability: "",
    bio: "",
    password: "",
    charges: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, dataset } = e.target;
    const index = dataset.index;

    if (name === "skills" || name === "experience") {
      const updatedArray = [...formData[name]];
      updatedArray[index] = value;
      setFormData((prevData) => ({ ...prevData, [name]: updatedArray }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const currentUserId = currentUser?._id;
      // const isMentor = currentUser?.role === "mentor";
      const isMentor = true; // For testing purposes
      const baseUrl = "https://mentormatch-ewws.onrender.com";
      const endpoint = isMentor
        ? `${baseUrl}/mentor?id=${currentUserId}`
        : `${baseUrl}/mentee?id=${currentUserId}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const user = await response.json();
      setFormData({
        name: user[0].name || "",
        skills: user[0].skills || ["", "", ""],
        experience: user[0].experience || ["", "", ""],
        availability: user[0].availability || "",
        bio: user[0].bio || "",
        password: user[0].password || "",
        charges: user[0].charges || "",
      });
      setProfileImage(user[0].photo || null);
      console.log("User profile fetched:", user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("An error occurred. Please try again later.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.password) {
      setErrors({
        fullName: !formData.fullName ? "Full name is required" : "",
        password: !formData.password ? "Password is required" : "",
      });
      return;
    }

    setLoading(true);
    try {
      const currentUserId = JSON.parse(localStorage.getItem("user"))._id;
      const response = await fetch(
        `https://mentormatch-ewws.onrender.com/update/${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            profileImage,
          }),
        }
      );

      if (response.ok) {
        toast.success("Profile updated successfully!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          transition: Bounce,
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred. Please try again later.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const currentUserId = JSON.parse(localStorage.getItem("user"))?._id;

    if (!currentUserId) {
      toast.error("User ID not found.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        transition: Bounce,
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`https://mentormatch-ewws.onrender.com/user/${currentUserId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Profile deleted successfully.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          transition: Bounce,
        });

        localStorage.clear(); // Clear local storage
        window.location.reload(); // Reload the page
        navigate('/'); // Redirect to home page
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete profile");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("An error occurred. Please try again later.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        transition: Bounce,
      });
    }
  };


  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-r from-blue-600 via-pink-400 to-red-500 font-raleway">
        <main className="container mx-auto px-6 py-12">
          {loading ? (
            <div className="flex justify-center items-center h-[70vh]">
              <div className="w-48 h-48 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-9 md:p-12 max-w-3xl mx-auto">
              <form onSubmit={handleSubmit}>
                <div className="mb-8 text-center">
                  <label className="block text-lg font-medium mb-2">Profile Picture</label>
                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="profileImageInput"
                      className="w-32 h-32 bg-gray-200 rounded-sm flex items-center justify-center text-gray-500 mb-4 border border-gray-300 shadow-md cursor-pointer hover:bg-gray-300"
                    >
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile Preview"
                          className="w-full h-full object-cover rounded-sm"
                        />
                      ) : (
                        "Click to upload"
                      )}
                    </label>
                    <input
                      id="profileImageInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                {/* Form Fields */}
                <div className="mb-4">
                  <label className="block text-lg font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>


                {/* {isMentor && ( */}
                <div>
                  <div className="mb-4">
                    <label className="block text-lg font-medium mb-2">Skills</label>
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        name="skills"
                        value={formData.skills[index] || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                        data-index={index}
                      />
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-lg font-medium mb-2">Experience</label>
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        name="experience"
                        value={formData.experience[index] || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                        data-index={index}
                      />
                    ))}
                  </div>

                </div>
                {/* )} */}

                <div className="mb-4">
                  <label className="block text-lg font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-lg font-medium mb-2">Charges (in INR)</label>
                  <input
                    type="text"
                    name="charges"
                    value={formData.charges}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>


                <div className="text-center flex items-center justify-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-purple-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 ${loading ? "opacity-50 cursor-not-allowed" : ""
                      } sm:py-3 sm:px-8 sm:text-base py-2 px-6 text-sm`}
                  >
                    {loading ? "Saving..." : "UPDATE PROFILE"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-700 transition duration-300 sm:py-3 sm:px-8 sm:text-base py-2 px-6 text-sm"
                  >
                    DELETE PROFILE
                  </button>


                </div>
              </form>
            </div>
          )}
        </main>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ProfileSetUp;
