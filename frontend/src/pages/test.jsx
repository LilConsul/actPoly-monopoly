import React, { useEffect, useState } from "react";

const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Disconnected");

  // Establish WebSocket connection on component mount
  useEffect(() => {
    const ws = new WebSocket("wss://localhost/api/ws/game/bf0d5474-9838-48e7-a65d-85da8ad5adbc");

    // Set up event listeners
    ws.onopen = () => {
      console.log("WebSocket connection established.");
      setStatus("Connected");
    };

    ws.onmessage = (event) => {
      const receivedMessage = event.data;
      console.log("Received message:", receivedMessage);
      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
      setStatus("Disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Save the WebSocket instance to state
    setSocket(ws);

    // Cleanup WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []);

  // Function to send a message through WebSocket
  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
      setMessage(""); // Clear input field after sending
    } else {
      console.error("WebSocket is not open.");
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <p>Status: {status}</p>

      {/* Display received messages */}
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>

      {/* Input field and send button */}
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default WebSocketComponent;