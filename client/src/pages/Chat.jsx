import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Import useParams to get dynamic route params

const Chat = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null); // State for WebSocket connection
  const chatEndRef = React.useRef(null);
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored in localStorage

  // Extract senderId from user data
  const senderId = user ? user._id : null;

  useEffect(() => {
    if (!roomId) {
      console.error("roomId is undefined, cannot establish connection");
      return;
    }
    if (!senderId) {
      console.error("senderId is undefined, cannot establish connection");
      window.location.href = '/login'
      return; 
    }

    // Create WebSocket connection directly within useEffect (this runs only once when component mounts)
    const socketConnection = new WebSocket("wss://mentormatch-ewws.onrender.com"); // Replace with your server's WebSocket endpoint

    socketConnection.onopen = () => {
      console.log("Connected to WebSocket server");

      // Join the room using roomId from URL
      const joinMessage = { type: "joinRoom", roomId,senderId:senderId };
      socketConnection.send(JSON.stringify(joinMessage)); // Send a message to the server
    };

    socketConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chatHistory") {
        setMessages(message.messages);
        setIsLoading(false);
      } else if (message.type === "receiveMessage") {
        setMessages((prev) => [...prev, message]);
      }
    };

    socketConnection.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    socketConnection.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    // Save the socket connection in state
    setSocket(socketConnection);

    // Cleanup: Close WebSocket connection on component unmount
    return () => {
      if (socketConnection) {
        socketConnection.close();
        console.log("WebSocket connection closed");
      }
    };
  }, [roomId]); // Only re-run the effect if roomId changes

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;

    if (!roomId) {
      console.error("roomId is undefined, cannot send message");
      return;
    }

    const message = {
      type: "sendMessage",
      roomId,
      senderId,  // Use the dynamic senderId from localStorage
      text: inputMessage,
    };

    // Emit the message to the backend (send via WebSocket)
    if (socket) {
      socket.send(JSON.stringify(message));

      // Optimistically update the chat UI
      setMessages((prev) => [
        ...prev,
        { senderId: senderId, text: inputMessage, timestamp: new Date().toISOString() },
      ]);
      setInputMessage("");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900 text-white py-4 px-6 text-2xl font-semibold shadow-lg">
        Chat Room
      </div>

      {/* Loader */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Messages Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.senderId === senderId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-xl shadow-md ${
                    msg.senderId === senderId ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Section */}
          <div className="bg-gray-800 p-4 shadow-md">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-500 text-white px-4 py-2 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 w-[10vw] bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
