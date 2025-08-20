import React, { useEffect, useState } from "react";
import "./Rag.css";

export default function Rag() {
  const [textInput, setTextInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [Allfiles,setAllFiles]=useState([])
  const [selectedFile,setSelectedFile]=useState(null)
  const [isuploading,setIsUploading]=useState(false)
  const [ragChunks, setRagChunks] = useState([]);
  
  const formData = new FormData();

  const handleSubmit = async () => {
    try {
      const res = await fetch("https://notebooklm-642n.onrender.com/api/textInput", {
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

  const handleFileUpload = async(event) => {
    try{
      setIsUploading(true)
      const file = event.target.files[0];
      
      if (file) {
        formData.append("file", file);
        formData.append("filename", file.name);   
      
      }
      const res = await fetch("https://notebooklm-642n.onrender.com/api/pdfInput", {
        method: "POST",
        body: formData,
      });
  if(res.status===200)
  {
    const data = await res.json();
      console.log(data);
      alert("file has been upload ")
  
  }
    }
    catch(e){
      console.log("Error in Uploading",e)
    }
   
  finally{
    setIsUploading(false)
  }
  };

 

  const getFileName=async ()=>{
try{
const res=await fetch('https://notebooklm-642n.onrender.com/api/collections')
const data=await res.json()
console.log("collections ",data)
setAllFiles(data.collections)
}
catch(e){
console.log("unbale to get files name ",e)
}
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !selectedFile) return;
  
    // Show user’s message in UI
    setRagChunks([])
    const newMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, newMessage]);
  
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
  console.log("chunks",data.chunks)
      // Show retrieved chunks
      setRagChunks(data.chunks || []);
  
      // Show bot’s reply
      const botMessage = { sender: "bot", text: data.answer };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error fetching response" },
      ]);
    }
  
    setChatInput("");
  };

  useEffect(()=>{getFileName()},[])
  return (
   <>
    {
      isuploading?("loading.."):(
        <div className="rag-container">
     <h1 style={{textAlign:"center"}}>RAG</h1>

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
              
              />
            
            </div>
          
          </div>

        {/* Middle Column - RAG Chunk */}
        {/* <div className="middle-column">
          <div className="rag-chunk-area">
            <h2>RAG CHUNK</h2>
            <div className="chunk-content">
  {ragChunks.length > 0 ? (
    ragChunks.map((chunk, idx) => (
      <div key={idx} className="rag-chunk">
        <strong>Refernce {idx + 1}:</strong>
        <p>{chunk.text}</p>
      </div>
    ))
  ) : (
    <p>Retrieved chunks will appear here...</p>
  )}
</div>
          </div>
        </div> */}

        {/* Right Column - Chat Interface */}
     
        <div className="right-column">
        <label htmlFor="filename"> Select file
        <select
  name="filename"
  value={selectedFile}
  onChange={(e) => setSelectedFile(e.target.value)}
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
      )
    }
   
   
    </>
  );
}
