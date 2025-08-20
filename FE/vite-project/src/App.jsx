import { useState } from "react";

import "./App.css";
import Rag from "./Component/Rag";

function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100vh",
        gap: "20px",
      }}
    >
      <h3>Document Chat with GenAI (RAG Demo)</h3>

      <Rag />
    </div>
  );
}

export default App;
