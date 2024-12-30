import React, { useEffect, useState } from "react";
import { FaEnvelope, FaPhone, FaWallet } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Mentorship = () => {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [requestsm, setRequestsm] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    function doChat(request){
        if(request.role === 'mentee'){
            window.location.href = `/chat/${user._id}`
        }else if(request.role === 'mentor'){
            window.location.href = `/chat/${request._id}`
        }
    }
    // Fetch user data from localStorage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            setRequestsm(storedUser.mentorshipRequests); // Store local data
        } else {
            setError("No user found in localStorage");
        }
    }, []);

    // Fetch mentorship data based on accumulated mentorId or menteeId
    useEffect(() => {
        const fetchMentorshipDetails = async () => {
            const storedUser = JSON.parse(localStorage.getItem("user"));

            if (!storedUser) return;
            if (storedUser.mentorshipRequests.length === 0) return;

            try {
                const ids = storedUser.mentorshipRequests.map(request =>
                    storedUser.role === 'mentee' ? request.mentorId : request.menteeId
                );

                const role = storedUser.role;
                const userId = storedUser._id;

                const response = await fetch(`https://mentormatch-ewws.onrender.com/mentorship/details/${role}/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ids }),
                });

                const data = await response.json();
                if (response.ok) {
                    if (role === 'mentee') {
                        // Add status from localStorage (requestsm)
                        const mergedRequests = data.mentorDetails.map(request => {
                            const storedRequest = requestsm.find(r => r.mentorId === request._id);
                            return { ...request, status: storedRequest?.status || "pending" };
                        });
                        setRequests(mergedRequests);
                    } else {
                        const mergedRequests = data.menteeDetails.map(request => {
                            const storedRequest = requestsm.find(r => r.menteeId === request._id);
                            return { ...request, status: storedRequest?.status || "pending" };
                        });
                        setRequests(mergedRequests);
                    }
                } else {
                    setError(data.message);
                }
            } catch (error) {
                console.error('Error fetching mentorship details:', error);
                setError('There was an error fetching the mentorship details.');
            }
        };

        fetchMentorshipDetails();
    }, [user, requestsm]);

    const handleRequestResponse = async (requestId, action, requestType) => {
        try {
            const url =
                requestType === "mentor"
                    ? `https://mentormatch-ewws.onrender.com/request/mentor/${user._id}/${requestId}`
                    : `https://mentormatch-ewws.onrender.com/request/mentee/${user._id}/${requestId}`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();
            if (response.ok) {
                setRequests((prevRequests) =>
                    prevRequests.map((request) =>
                        request._id === requestId ? { ...request, status: action } : request
                    )
                );
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error updating request:", error);
            setError("There was an error processing your request.");
        }
    };



    return (
        <div>
            <Navbar />
            <div className="py-[5vh] px-[8vw] bg-gray-800 min-h-screen">
                <h1 className="text-3xl font-bold text-center mb-6 text-white">
                    {user?.role === "mentor" ? "Mentorship Requests" : "Mentorship Offers"}
                </h1>

                {/* Requests Section */}
                <div>
                    {requests.length === 0 ? (
                        <div className="text-center text-gray-300">
                            <p>No mentorship requests at the moment.</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-[1300px]:gap-4 max-[1300px]:px-4 px-6">
                            {requests.map((request) => (
                                <div
                                    key={request._id}
                                    className="bg-gray-700 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <img
                                                src={request.photo}
                                                alt={request.name}
                                                className="w-52 h-52 rounded-md object-cover shadow-md"
                                            />
                                            <h2 className="text-2xl font-bold text-[#3674c9] text-center">{request.name}</h2>
                                        </div>

                                        <div className="flex flex-col gap-4 flex-1">
                                            <div className="flex justify-between items-center max-1270:flex-col max-1270:items-start max-1270:gap-4">
                                                <p className="text-sm flex items-center gap-2">
                                                    <FaEnvelope className="text-white" /> {request.email || "N/A"}
                                                </p>
                                                <p className="text-sm flex items-center gap-2">
                                                    <FaPhone className="text-white" />{" "}
                                                    {request.mobile ? `+91-${request.mobile}` : "N/A"}
                                                </p>
                                            </div>
                                            <p className="text-sm">
                                                <span className="font-semibold">Availability:</span>{" "}
                                                {request.availability || "N/A"}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-semibold">Experience:</span>
                                                <ul className="list-disc pl-5 mt-1">
                                                    {request.experience?.map((exp, index) => (
                                                        <li key={index}>{exp}</li>
                                                    ))}
                                                </ul>
                                            </p>
                                            <p className="text-sm flex items-center gap-2">
                                                <button className="flex items-center gap-2 bg-green-600 text-white font-bold py-1 px-3 rounded-full shadow-md">
                                                    <FaWallet className="h-[20px]" />
                                                    {request.charges ? `₹${request.charges} / hour` : "N/A"}
                                                </button>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Request Action Buttons */}
                                    {user?.role === "mentor" && request.status === "pending" && (
                                        <div className="flex justify-between gap-4 mt-4 w-full">
                                            <button
                                                onClick={() => handleRequestResponse(request._id, "accepted", 'mentor')}
                                                className="bg-green-600 text-white w-full py-2 px-4 rounded-full hover:bg-green-700"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRequestResponse(request._id, "declined", 'mentor')}
                                                className="bg-red-600 text-white py-2 px-4 w-full rounded-full hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {user?.role === "mentee" && request.status === "pending" && (
                                        <div className="flex justify-between gap-4 mt-4 w-full">
                                            <button
                                                onClick={() => handleRequestResponse(request._id, "accepted", 'mentee')}
                                                className="bg-green-600 text-white w-full py-2 px-4 rounded-full hover:bg-green-700"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRequestResponse(request._id, "declined", 'mentee')}
                                                className="bg-red-600 text-white py-2 px-4 w-full rounded-full hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {request.status === "accepted" && (
                                        <div className="flex justify-between gap-4 mt-4 w-full">
                                            <button
                                                onClick={()=>doChat(request)}
                                                className={`mt-auto font-bold shadow-lg py-2 px-4 rounded-lg w-full bg-green-500 text-white hover:bg-green-600 transition`}
                                            >
                                                Chat Now
                                            </button>

                                        </div>
                                    )}
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mentorship;
