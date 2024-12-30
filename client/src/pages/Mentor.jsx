import React, { useEffect, useState } from "react";
import { FaSearch, FaPhone, FaEnvelope, FaWallet } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { redirect } from "react-router-dom";

const Mentor = () => {
  const [mentors, setMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loader, setLoader] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const role = JSON.parse(localStorage.getItem("user"))?.role;

  // Fetch mentors from the API
  const fetchMentors = async (query = "") => {
    setLoader(true);
    try {
      const url = `https://mentormatch-ewws.onrender.com/mentor${query}`;
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;
      const filteredMentors = data.filter((mentor) => mentor._id !== userId);

      setMentors(filteredMentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
    } finally {
      setLoader(false);
    }
  };

  // Handle search input
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    const query = value ? `?name=${value}` : "";
    fetchMentors(query);
  };

  // Handle skill filter
  const handleSkillFilter = (skill) => {
    let updatedSkills;
    if (skill === "My Interests") {
      if (selectedSkills.includes(skill)) {
        updatedSkills = selectedSkills.filter((s) => s !== skill);
      } else {
        updatedSkills = ["My Interests"];
      }
    } else {
      updatedSkills = selectedSkills.includes(skill)
        ? selectedSkills.filter((s) => s !== skill)
        : [...selectedSkills.filter((s) => s !== "My Interests"), skill];
    }
    setSelectedSkills(updatedSkills);

    if (updatedSkills.includes("My Interests")) {
      filterByInterests();
    } else {
      const query = updatedSkills.length ? `?skill=${updatedSkills.join(",")}` : "";
      fetchMentors(query);
    }
  };

  // filter mentors by interests
  const filterByInterests = () => {
    const myskill = JSON.parse(localStorage.getItem("user")) || [];
    const myskills = myskill.skills || [];
    if (myskills.length === 0) {
      console.warn("No skills found in local storage for filtering.");
      return;
    }

    setLoader(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      const filteredMentors = mentors.filter(
        (mentor) =>
          mentor._id !== userId &&
          mentor.skills?.some((skill) => myskills.includes(skill))
      );

      console.warn("filteredMentors", filteredMentors);
      setMentors(filteredMentors);
    } catch (error) {
      console.error("Error filtering mentors by interests:", error);
    } finally {
      setLoader(false);
    }
  };

  //handle connect
  const handleConnect = (mentorId) => {
    setConnectionStatus((prevStatus) => ({
      ...prevStatus,
      [mentorId]: "Requested",
    }));
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="py-[5vh] px-[8vw] bg-gray-800 min-h-screen">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Find Your Mentor</h1>

        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Search for a mentor"
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {["My Interests", "Cricket", "Football", "AI/ML", "Coding", "Data Analyst", "Web Development"].map(
            (skill) => (
              <button
                key={skill}
                onClick={() => handleSkillFilter(skill)}
                className={`${selectedSkills.includes(skill)
                  ? "bg-blue-500 text-white"
                  : "bg-[#F0EAEB] text-gray-700"
                  } border border-gray-300 p-2 px-4 rounded-lg cursor-pointer transition-all duration-300`}
              >
                {skill}
              </button>
            )
          )}
        </div>

        {loader ? (
          <div className="flex justify-center items-center h-[70vh]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-[1300px]:gap-4 max-[1300px]:px-4 max-1130:px-15 px-6 max-1130:grid-cols-1 max-[768px]:px-[8vw] min-[530px]:px-[8vw] max-530:px-4">
            {mentors.length > 0 ? (
              mentors.map((mentor) => (
                <div
                  key={mentor._id}
                  className="bg-gray-700 text-white max-[1300px]:p-2 p-4 rounded-lg shadow-md hover:shadow-lg transition flex flex-col"
                >
                  <div className="flex flex-col md:flex-row md:items-start items-center gap-6 m-4">

                    {/* Photo and Name */}
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={mentor.photo || "https://via.placeholder.com/150"}
                        alt={mentor.name}
                        className="w-52 h-52 rounded-md object-cover shadow-md"
                      />
                      <h2 className="text-2xl font-bold text-[#3674c9] text-center">
                        {mentor.name}
                      </h2>
                    </div>

                    {/* Mentor Details */}
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex justify-between items-center max-1270:flex-col max-1270:items-start max-1270:gap-4">
                        <p className="text-sm flex items-center gap-2">
                          <FaEnvelope className="text-white" /> {mentor.email || "N/A"}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <FaPhone className="text-white" />{" "}
                          {mentor.mobile ? `+91-${mentor.mobile}` : "N/A"}
                        </p>
                      </div>
                      <p className="max-1200:hidden text-[11px]">{mentor.bio}</p>
                      <p className="text-sm">
                        <span className="font-semibold">Availability:</span>{" "}
                        {mentor.availability || "N/A"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Experience:</span>
                        <ul className="list-disc pl-5 mt-1">
                          {mentor.experience?.map((exp, index) => (
                            <li key={index}>{exp}</li>
                          ))}
                        </ul>
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-green-600 text-white font-bold py-1 px-3 rounded-full shadow-md">
                          <FaWallet className="h-[20px]" />
                          {mentor.charges ? `₹${mentor.charges} / hour` : "N/A"}
                        </button>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {mentor.skills?.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat Button */}
                  {role === "mentee" && (
                    <button
                    onClick={() => handleConnect(mentor._id)}
                    className="mt-auto bg-yellow-500 text-white font-bold shadow-lg py-2 px-4 rounded-lg w-full hover:bg-yellow-600 transition duration-300 ease-in-out transform hover:-translate-y-1"
                  >
                    {connectionStatus[mentor._id] || "Connect"}
                  </button>
                  
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No mentors found. Try a different search term.
              </p>
            )}
          </section>



        )}
      </div>
    </div>
  );
};

export default Mentor;
