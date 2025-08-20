import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "langchain/document";
import { v4 as uuidv4 } from "uuid";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import OpenAI from "openai";


export const processText = async (req, res) => {
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
    const qdrant = new QdrantClient({
      url: "https://be1e17fc-8bdc-4b2f-a7d0-077021166852.europe-west3-0.gcp.cloud.qdrant.io",
      apiKey: process.env.QDRANTKEY,
    });

    const collectionName = `${Math.ceil(Math.random()*100)} my_rag_collection_text`;
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
            id: uuidv4(),
            vector,
            payload: {
              text: d.pageContent,       // 👈 store actual chunk text
              ...d.metadata,             // 👈 keep existing metadata too
            },
          },
        ],
      });
    }
    res
      .status(200)
      .json({ message: "Document stored in Qdrant", chunks: docs.length });
  } catch (e) {
    console.error("Error in textInput route:", e);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const ProcessPdf = async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    console.log("📄 Uploading:", originalName);

    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunkedDocs = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAIKEY,
      model: "text-embedding-3-small",
    });

    const qdrant = new QdrantClient({
      url: process.env.CLUSTERENDPOINT,
      apiKey: process.env.QDRANTKEY,
    });

    const collectionName = originalName; // 👈 Each PDF = 1 collection

    // Create collection if not exists
    await qdrant
      .createCollection(collectionName, {
        vectors: { size: 1536, distance: "Cosine" },
      })
      .catch(() => console.log("ℹ️ Collection already exists:", collectionName));

    // Store chunks
    for (const d of chunkedDocs) {
      const vector = await embeddings.embedQuery(d.pageContent);
      await qdrant.upsert(collectionName, {
        points: [
          {
            id: uuidv4(),
            vector,
            payload: {
              text: d.pageContent,
              filename: originalName, // 👈 Important for filtering
            },
          },
        ],
      });
    }

    // Delete local file
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "✅ PDF processed and stored in Qdrant Cloud",
      chunks: chunkedDocs.length,
    });
  } catch (err) {
    console.error("❌ Error in PDF Processing:", err);
    res.status(500).json({ error: "PDF processing failed" });
  }
};
// 📌 Ask Route
export const askRoutes = async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });
    const qdrant = new QdrantClient({
      url: process.env.CLUSTERENDPOINT,
      apiKey: process.env.QDRANTKEY,
    });

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAIKEY,
      model: "text-embedding-3-small",
    });

    const { query, filename } = req.body;

    if (!query || !filename) {
      return res.status(400).json({ error: "query and filename are required" });
    }

    // 1️⃣ Create embedding for query
    const queryEmbedding = await embeddings.embedQuery(query);

    // 2️⃣ Search in Qdrant
    const searchResult = await qdrant.search(filename, {
      vector: queryEmbedding,
      limit: 3,
    });

    // 3️⃣ Prepare context
    const context = searchResult
    .map((item, i) => {
      const { text, pageNumber, paragraph, fileName } = item.payload;
  
      return `
      Chunk ${i + 1}:
      File: ${fileName || "Unknown"}
      Page: ${pageNumber || "N/A"}
      Paragraph: ${paragraph || "N/A"}
      Content: ${text}
      `;
    })
    .join("\n\n");

    // 4️⃣ Ask OpenAI
    const prompt = `
    You are an AI assistant. Use only the following content to answer the user about the document.


    ${context}

    Question: ${query}
    Answer:
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = completion.choices[0].message.content;

    res.json({ answer, chunks: searchResult.map((r) => r.payload) });
  } catch (error) {
    console.error("❌ Ask route error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const listCollections = async (req, res) => {
  try {
    const qdrant = new QdrantClient({
      url: process.env.CLUSTERENDPOINT,
      apiKey: process.env.QDRANTKEY,
    });

    const collections = await qdrant.getCollections();

    // collections.collections = array of { name: string }
    const collectionNames = collections.collections.map((c) => c.name);

    res.status(200).json({
      collections: collectionNames, // file names you uploaded
    });
  } catch (err) {
    console.error("❌ Error fetching collections:", err);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};