import React, { useState, useEffect } from "react";
import { FaSearch, FaPhone, FaEnvelope } from "react-icons/fa";
import Navbar from "../components/Navbar";

const Mentee = () => {
  const [mentees, setMentees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loader, setLoader] = useState(false);
  const [requests, setRequests] = useState({});
  const user =  JSON.parse(localStorage.getItem("user"))
  const role = JSON.parse(localStorage.getItem("user"))?.role;
  function doChat(request){
    if(request.role === 'mentee'){
        window.location.href = `/chat/${user._id}`
    }else if(request.role === 'mentor'){
        window.location.href = `/chat/${request._id}`
    }
}
  // Fetch mentees from the API
  const fetchMentees = async (query = "") => {
    setLoader(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?._id;

      const url = `https://mentormatch-ewws.onrender.com/mentee${query}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch mentees: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      // Filter out mentees whose userId matches the logged-in user's ID
      const filteredMentees = data.filter((mentee) => mentee.userId !== userId);

      setMentees(filteredMentees);
      // Update request statuses for the mentees
      const updatedRequests = {};
      filteredMentees.forEach((mentee) => {
        // Check if a request exists for this mentee and update status
        const requestStatus = mentee.mentorshipRequests.find(
          (request) => request.status === "pending" || request.status === "accepted"
        );
        if (requestStatus) {
          updatedRequests[mentee._id] = requestStatus.status;
        } else {
          updatedRequests[mentee._id] = "no_request";
        }
      });
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Error fetching mentees:", error.message || error);
    } finally {
      setLoader(false);
    }
  };

  // Handle request for mentorship
  const handleRequest = async (menteeId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const request_from = user?._id;

    if (!request_from || !menteeId) return;

    try {
      const response = await fetch("https://mentormatch-ewws.onrender.com/sendMentorshipRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_to: menteeId, request_from }),
      });

      if (!response.ok) {
        throw new Error("Failed to send mentorship request.");
      }

      const result = await response.json();
      // Mark the request as pending after sending it
      setRequests((prev) => ({ ...prev, [menteeId]: "pending" }));
    } catch (error) {
      console.error("Error sending mentorship request:", error.message || error);
    }
  };

  useEffect(() => {
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
              onChange={(event) => {
                setSearchTerm(event.target.value);
                const query = event.target.value ? `?name=${event.target.value}` : "";
                fetchMentees(query);
              }}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Mentee Cards */}
        {loader ? (
          <div className="flex justify-center items-center h-[70vh]">
            <div className="w-48 h-48 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-8 max-1040:flex max-1040:flex-col max-470:px-2 max-[1225px]:px-4 px-7">
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
                      <p className="text-sm text-white flex items-center gap-2">
                        <FaEnvelope className="text-white" /> {mentee.email}
                      </p>
                      <p className="text-sm text-white flex items-center gap-2">
                        <FaPhone className="text-white" /> {mentee.mobile ? `+91-${mentee.mobile}` : ""}
                      </p>
                      <p className="text-[12px] text-white">{mentee.bio}</p>
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

                  {role === "mentor" && (
                    <button
                      onClick={() =>
                        requests[mentee._id] === "pending"
                          ? null
                          : requests[mentee._id] === "accepted"
                          ? doChat(mentee)
                          : handleRequest(mentee._id)
                      }
                      className={`mt-auto font-bold shadow-lg py-2 px-4 rounded-lg w-full ${
                        requests[mentee._id] === "pending"
                          ? "bg-gray-500 text-white cursor-not-allowed"
                          : requests[mentee._id] === "accepted"
                          ? "bg-green-500 text-white hover:bg-green-600 transition"
                          : "bg-yellow-500 text-white hover:bg-yellow-600 transition"
                      }`}
                      disabled={requests[mentee._id] === "pending"}
                    >
                      {requests[mentee._id] === "pending"
                        ? "Requested"
                        : requests[mentee._id] === "accepted"
                        ? "Chat Now"
                        : "Request"}
                    </button>
                  )}
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
