import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mentor from '../assets/mentor.jpg';
import team from '../assets/team.jpg';

const About = () => {
    const [auth, setAuth] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setAuth(localStorage.getItem('user'));
    }, []);

    return (
        <div className="pb-40 font-poppins bg-gray-800">
            
            {/* Intro Section */}
            <div
                className="relative min-h-[130vh] flex flex-col justify-between gap-12 px-16 py-12 text-white bg-cover bg-center before:absolute before:inset-0 before:bg-black/50"
                style={{ backgroundImage: `url(${mentor})` }}
            >
                <div className="relative z-10 flex items-center gap-10 pt-6">
                    <div className="text-xl sm:text-2xl font-semibold font-raleway">MentorMatch</div>
                    <div
                        className="text-lg sm:text-xl font-light cursor-pointer hover:text-red-400"
                        onClick={() => navigate('/')}
                    >
                        Home
                    </div>
                    <div className="text-lg sm:text-xl font-light">
                        <a
                            href="mailto:contact@mentormatch.com"
                            className="text-white no-underline hover:underline"
                        >
                            Contact
                        </a>
                    </div>
                </div>
                <div className="relative z-10 text-4xl font-semibold text-center">
                    Empowering mentorship, fostering growth.
                </div>
            </div>

            {/* About Us Section */}
            <div className="text-4xl font-semibold text-white text-center py-12">About Us</div>

            <div className="mx-12 lg:mx-48 mt-12 flex flex-col gap-12">
                <div className="text-3xl text-white font-medium">
                    Connecting mentors and mentees for a <span className="text-red-500">brighter future</span>
                </div>

                <p className="text-lg  text-white leading-relaxed">
                    At MentorMatch, we believe in the power of mentorship to drive personal
                    and professional growth. Our platform connects mentors and mentees
                    based on shared interests, skills, and goals, fostering meaningful
                    relationships that help individuals thrive in their careers and life
                    journeys.
                </p>
                <p className="text-lg  text-white leading-relaxed">
                    Whether you are a student looking for career guidance, a professional
                    seeking mentorship in a new field, or an expert willing to share your
                    knowledge, MentorMatch is the platform for you. We ensure seamless
                    connections, making mentorship accessible, valuable, and impactful for
                    everyone involved.
                </p>
                <p className="text-lg  text-white leading-relaxed">
                    Our mission is to create a world where mentorship is not a privilege
                    but a resource accessible to all. By providing tools to connect and
                    communicate effectively, we aim to break barriers, bridge knowledge
                    gaps, and foster communities of learning and growth.
                </p>
            </div>

            {/* Who Are We Section */}
            <div className="mt-32 mx-12 text-white lg:mx-48">
                <div className="text-3xl font-semibold mb-8">
                    Who Are We?
                </div>
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-32 items-center">
                    <div className="text-lg leading-relaxed">
                        <p>
                            We are the team behind <span className="font-bold text-purple-500">MentorMatch</span>, a dedicated group of individuals passionate about mentorship, growth, and technology. Our team comprises developers, designers, and professionals from diverse backgrounds, all united by a single goal: to empower individuals through meaningful mentor-mentee relationships.
                        </p>
                        <p className="mt-4">
                            Our journey began with a vision to solve real-world challenges faced by students, professionals, and lifelong learners. With expertise in <span className="font-bold text-red-500">AI and data-driven solutions</span>, we are building a platform that connects people based on shared goals, skills, and aspirations.
                        </p>
                        <p className="mt-4">
                            Together, we invite you to join us on this exciting journey. Whether as a mentor or a mentee, you are a vital part of our mission to build a stronger, mentorship-driven future.
                        </p>
                    </div>
                    <img
                        src={team}
                        alt="Team working together"
                        className="max-w-[40vw] max-h-[60vh] lg:max-w-[40vw] rounded-xl cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105"
                    />
                </div>
            </div>
        </div>
    );
};

export default About;