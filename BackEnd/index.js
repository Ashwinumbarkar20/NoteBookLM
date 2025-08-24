import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { processText,ProcessPdf,askRoutes,listCollections,uploadNewCourseVTT,uploadExistingCourseVTT } from "./controller.js";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // allow your React frontend
const upload = multer({ dest: "uploads/" });

app.post("/api/textInput",processText);
app.post("/api/pdfInput", upload.single("file"),ProcessPdf);
app.post("/api/ask", askRoutes);
app.get('/api/collections',listCollections)
app.post('/api/uploadNewVTTfiles',upload.array("files"),uploadNewCourseVTT)
app.post('/api/uploadExistingVTTfiles',upload.array("files"),uploadExistingCourseVTT)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`✅ Server running on http://localhost:${PORT}`)
);
