import React, { useEffect, useState } from "react";
import { marked } from "marked"; // install: npm install marked
import "./Rag.css";

export default function Rag() {
  const [textInput, setTextInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [Allfiles, setAllFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [Typing, setTyping] = useState(false);
  //const [ragChunks, setRagChunks] = useState([]);

  const formData = new FormData();

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        "https://notebooklm-642n.onrender.com/api/textInput",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ textInput }),
        }
      );
      if (res.status === 200) {
        alert("Data Added Successfully");
        setTextInput("");
      }
    } catch (e) {
      console.log(e);
      alert("Something went wrong!");
    }
  };

  const handleFileUpload = async (event) => {
    try {
      setIsUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      formData.append("file", file);
      formData.append("filename", file.name);

      const res = await fetch(
        "https://notebooklm-642n.onrender.com/api/pdfInput",
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.status === 200) {
        await res.json();
        alert("File uploaded successfully");
        getFileName();
      }
    } catch (e) {
      console.log("Error in Uploading", e);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileName = async () => {
    try {
      const res = await fetch(
        "https://notebooklm-642n.onrender.com/api/collections"
      );
      const data = await res.json();
      setAllFiles(data.collections);
    } catch (e) {
      console.log("Unable to get files name", e);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !selectedFile) return;
    setTyping(true);
    //setRagChunks([]);
    const newMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput("");
    try {
      const res = await fetch("https://notebooklm-642n.onrender.com/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: chatInput,
          filename: selectedFile,
        }),
      });

      const data = await res.json();

      const botMessage = { sender: "bot", text: data.answer };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error fetching response" },
      ]);
    } finally {
      setTyping(false);
    }

    //setChatInput(""); // clear input
  };

  useEffect(() => {
    getFileName();
  }, []);

  return (
    <div className="rag-container">
     

      <div className="main-content">
        {/* Left Column */}
        {isUploading ? (
          "Documents Uploading...!"
        ) : (
          <div className="left-column">
            <textarea
              placeholder="Type some text..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={8}
              cols={40}
              disabled={isUploading}
            />

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isUploading}
            >
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
                disabled={isUploading}
              />
            </div>
          </div>
        )}

        {/* Right Column - Chat */}
        <div className="right-column">
          <label>
            Select File:
            <select
              name="filename"
              value={selectedFile}
              onChange={(e) => {
                setSelectedFile(e.target.value);
                setChatMessages([]);
              }}
            >
              <option value="">-- Select a file --</option>
              {Allfiles?.map((filename) => (
                <option key={filename} value={filename}>
                  {filename.replace(".pdf", "")}
                </option>
              ))}
            </select>
          </label>

          <div className="chat-section">
            <h3>Interacting with {selectedFile.split(".pdf")}</h3>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  <strong>{message.sender === "user" ? "You" : "Bot"}:</strong>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked(message.text || ""),
                    }}
                  />
                </div>
              ))}

              {/* 👉 Bot typing indicator */}
              {Typing && (
                <div className="message bot">
                  <em>Bot is typing...</em>
                </div>
              )}
            </div>
            {selectedFile.length > 0 ? (
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                  className="chat-input-field"
                  disabled={isUploading}
                />
                <button
                  onClick={handleChatSubmit}
                  className="chat-send-btn"
                  disabled={isUploading}
                >
                  Send
                </button>
              </div>
            ) : (
              <p>Please select the file before start the converation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
