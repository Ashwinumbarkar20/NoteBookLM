import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "langchain/document";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // allow your React frontend

app.post("/api/textInput", async (req, res) => {
	console.log(req);
	//create chuck first
	try {
		const { textInput } = req.body;
		console.log("textinput-->", textInput);
		const doc = new Document({
			pageContent: textInput,
			metadata: { source: "user-input" },
		});
		//creatig chcunks
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 500,
			chunkOverlap: 50,
		});
		const docs = await splitter.splitDocuments([doc]);

		// create vecotor embedding
		const embeddings = new OpenAIEmbeddings({
			apiKey: process.env.OPENAIKEY, // set in .env
			model: "text-embedding-3-small", // 1536 dims
		});

		//put chunk and embdding into vector database
		const qdrant = new QdrantClient({ url: "http://localhost:6333" });

		const collectionName = "my_rag_collection";
		await qdrant
			.createCollection(collectionName, {
				vectors: { size: 1536, distance: "Cosine" }, // 1536 for OpenAI embeddings
			})
			.catch(() => console.log("Collection already exists"));

		// Ensure collection exists

		for (const d of docs) {
			const vector = await embeddings.embedQuery(d.pageContent);
			await qdrant.upsert(collectionName, {
				points: [
					{
						id: uuidv4(), // Use proper UUID instead of random string
						vector,
						payload: d.metadata,
					},
				],
			});
		}

		res.status(200).json({ message: "Document stored in Qdrant", chunks: docs.length });
	} catch (e) {
		console.error("Error in textInput route:", e);
		res.status(500).json({ error: "Something went wrong" });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
	console.log(`✅ Server running on http://localhost:${PORT}`)
);
