import React, { useState } from "react";
import "./Rag.css";

export default function Rag() {
  const [textInput, setTextInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/textInput", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ textInput }),
      });
      if(res.status===200)
      {
        alert("Data Added Successfully")
        setTextInput('')
      }
    } catch (e) {
      console.log(e);
      alert("something went wrong Added Successfully")
    }

    // Handle text submission logic here
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("PDF uploaded:", file.name);
      // Handle PDF upload logic here
    }
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { text: chatInput, sender: "user" }]);
      setChatInput("");
      // Handle chat submission logic here
    }
  };

  return (
    <div className="rag-container">
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>NotBookLM</h2>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Column - Input Section */}
        <div className="left-column">
          <div className="text-input-area">
            <textarea
              placeholder="Text Area&#10;user can input&#10;Some text here"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={8}
              cols={40}
            />
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>

          <div className="pdf-upload-section">
            <label htmlFor="pdf-upload" className="pdf-upload-label">
              Upload PDF
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Middle Column - RAG Chunk */}
        <div className="middle-column">
          <div className="rag-chunk-area">
            <h2>RAG CHUNK</h2>
            <div className="chunk-content">
              {/* RAG chunk content will be displayed here */}
              <p>Retrieved chunks will appear here...</p>
            </div>
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="right-column">
          <div className="chat-section">
            <h3>User Chat with RAG</h3>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                className="chat-input-field"
              />
              <button onClick={handleChatSubmit} className="chat-send-btn">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
