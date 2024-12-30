import React, { useState, useEffect } from "react";
import { FaSearch, FaPhone, FaEnvelope, FaWallet } from "react-icons/fa";
import Navbar from "../components/Navbar";

const Mentee = () => {
  const [mentees, setMentees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loader, setLoader] = useState(false);

  const role = JSON.parse(localStorage.getItem("user"))?.role;

  // Fetch mentees from the API
  const fetchMentees = async (query = "") => {
    setLoader(true);
    try {
      // Get the logged-in user's ID from localStorage
      const user = JSON.parse(localStorage.getItem("user")); // Parse the JSON string
      const userId = user?._id; // Access the _id

      const url = `https://mentormatch-ewws.onrender.com/mentee${query}`;
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        throw new Error(`Failed to fetch mentees: ${response.statusText}`);
      }

      const data = await response.json();

      // Filter out mentees whose userId matches the logged-in user's ID
      const filteredMentees = data.filter((mentee) => mentee.userId !== userId);

      setMentees(filteredMentees);
    } catch (error) {
      console.error("Error fetching mentees:", error.message || error);
    } finally {
      setLoader(false);
    }
  };

  // handles search for mentees
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Fetch mentees based on search term or fetch all mentees if search term is empty
    const query = value ? `?name=${value}` : "";
    fetchMentees(query);
  };

  // returns the filtered mentees based on the selected skills
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
      fetchMentees(query);
    }
  };

  // filters the mentees based on the user's interests
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

      const filteredMentees = mentees.filter(
        (mentee) =>
          mentee._id !== userId &&
          mentee.skills?.some((skill) => myskills.includes(skill))
      );

      console.warn("filteredMentees", filteredMentees);
      setMentees(filteredMentees);
    } catch (error) {
      console.error("Error filtering mentors by interests:", error);
    } finally {
      setLoader(false);
    }
  };

  // redirects to the chat page with the mentee ID
  const handleConnect = (menteeId) => {
    // Redirect to chat page with mentee ID
    window.location.href = `/chat/${menteeId}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?._id;
    console.log("User ID:", userId);

    // Initial fetch to load all mentees
    fetchMentees();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="py-[5vh] px-[8vw] bg-gray-800 min-h-screen">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Find Your Mentees</h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Search for a mentee"
              value={searchTerm}
              onChange={handleSearch}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Skills Filter */}
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

        {/* Mentee Cards */}
        {loader ? (
          <div className="flex justify-center items-center h-[70vh]">
            <div className="w-48 h-48 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-8 max-1040:flex max-1040:flex-col max-470:px-2  max-[1225px]:px-4 px-7">
            {mentees.length > 0 ? (
              mentees.map((mentee) => (
                <div
                  key={mentee._id}
                  className="bg-gray-700 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition flex flex-col max-[520px]:items-center"
                >
                  <div className="flex max-530px:flex-col flex-row items-start gap-3 sm:gap-6 m-2 sm:m-4">
                    <img
                      src={mentee.photo || "https://via.placeholder.com/150"}
                      alt={mentee.name}
                      className="w-32 h-32 sm:w-52 sm:h-52 rounded-md object-cover shadow-md"
                    />
                    <div className="flex flex-col gap-4">
                      <h2 className="text-2xl font-bold text-[#3674c9]">{mentee.name}</h2>
                      <div className="flex justify-between items-center max-1270:flex-col max-1270:items-start gap-4 max-1270:gap-4">
                        <p className="max-470:text-[11px] text-sm text-white flex items-center gap-2">
                          <FaEnvelope className="text-white" /> {mentee.email}
                        </p>
                        <p className="max-470:text-[11px] text-sm text-white flex items-center gap-2">
                          <FaPhone className="text-white" /> {mentee.mobile ? `+91-${mentee.mobile}` : ""}
                        </p>
                      </div>

                      {/* bio */}
                      <p className="text-[12px] max-1270:hidden text-white">
                        <span className="font-semibold"><span className="font-bold text-blue-600"></span></span> {mentee.bio}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {mentee.skills?.slice(0, 3).map((skill, index) => (
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

                  {role === "mentor" &&
                    (<button onClick={() => handleConnect(mentee._id)} className="mt-auto bg-yellow-500 text-white font-bold shadow-lg py-2 px-4 rounded-lg w-full hover:bg-yellow-600 transition duration-300 ease-in-out transform hover:-translate-y-1">
                      Connect
                    </button>)
                  }
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No mentees found. Try a different search term.
              </p>
            )}
          </section>



        )}
      </div>
    </div>
  );
};

export default Mentee;
