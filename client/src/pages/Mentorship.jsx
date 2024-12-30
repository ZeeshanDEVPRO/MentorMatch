import React, { useEffect, useState, useCallback } from 'react';
import { FaEnvelope, FaPhone, FaUserCircle } from 'react-icons/fa';
import Navbar from '../components/Navbar';

const Mentorship = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));
    const { role, _id: id, mentees, mentors } = user || {};

    // fetches mentors for mentees and vice versa
    const fetchConnections = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const connectionIds = role === 'mentor' ? mentees : mentors;

            if (!connectionIds || connectionIds.length === 0) {
                setConnections([]);
                return;
            }

            const endpoint = role === 'mentor' ? 'mentee' : 'mentor';
            const responses = await Promise.all(
                connectionIds.map(async (connectionId) => {
                    const res = await fetch(
                        `https://mentormatch-ewws.onrender.com/${endpoint}?id=${connectionId}`
                    );
                    if (!res.ok)
                        throw new Error(`Failed to fetch ${endpoint} with ID: ${connectionId}`);
                    const data = await res.json();
                    return data[0]; // Assuming the API returns an array with one object
                })
            );

            setConnections(responses.filter(Boolean)); // Remove null/undefined responses
        } catch (err) {
            console.error('Error fetching connections:', err);
            setError('Failed to fetch connections. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchConnections();
    }, []);

    // redirects to chat page with the connection ID
    const handleChatClick = (connectionId) => {
        window.location.href = `/chat/${connectionId}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : connections.length === 0 ? (
                    <div className="text-center text-gray-300 bg-gray-700 p-6 rounded-lg shadow-lg">
                        <FaUserCircle className="mx-auto text-6xl mb-4" />
                        <p className="text-xl">You don't have any {role === 'mentor' ? 'mentees' : 'mentors'} yet.</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold text-center mb-12 text-white">
                            {role === 'mentor' ? 'Interact with your Mentees' : 'Interact with your Mentors'}
                        </h1>
                        <div className="px-[12vw] sm:px-[4vw] py-[5vh] sm:py-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {connections.map((connection) => (
                                <div
                                    key={connection._id}
                                    className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
                                >
                                    <div className="flex items-center justify-center max-[560px]:flex-col">

                                        {/* Image Section */}
                                        <div className="relative h-48 md:h-auto md:w-1/3 flex-shrink-0 overflow-hidden p-4">
                                            <img
                                                className="w-52 h-52 rounded-md object-cover shadow-md"
                                                src={
                                                    connection.photo ||
                                                    'https://via.placeholder.com/300?text=No+Image'
                                                }
                                                alt={connection.name}
                                            />
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-grow p-6 sm:p-4">
                                            {/* Name Section */}
                                            <h2 className="text-lg font-bold text-white mb-4 sm:text-lg">
                                                {connection.name}
                                            </h2>

                                            {/* Bio */}
                                            <p className="text-gray-300 text-xs mb-4 line-clamp-3 sm:text-xs">
                                                {connection.bio || 'No bio available'}
                                            </p>

                                            {/* Contact Information */}
                                            <div className="flex items-center text-sm text-gray-400 mb-2 sm:text-xs">
                                                <FaEnvelope className="mr-2" />
                                                {connection.email || 'N/A'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-400 mb-4 sm:text-xs">
                                                <FaPhone className="mr-2" />
                                                {connection.mobile || 'N/A'}
                                            </div>

                                            {/* Skills */}
                                            <h3 className="text-lg font-semibold text-white mb-2 sm:text-sm">Skills</h3>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {connection.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-blue-900 text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Chat Button */}
                                            {/* <button
                                                onClick={() => handleChatClick(connection._id)}
                                                className="w-full bg-yellow-500 text-white font-bold py-1 sm:py-2 px-2 sm:px-4 rounded-lg hover:bg-yellow-400 transition duration-300 ease-in-out transform hover:-translate-y-1"
                                            >
                                                Chat Now
                                            </button> */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>



                    </>
                )}
            </div>
        </div>
    );
};

export default Mentorship;

