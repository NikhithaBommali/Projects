# embedder.py

import os
import pickle
import faiss
import numpy as np
from typing import Optional
from sentence_transformers import SentenceTransformer

# === Constants ===
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
INDEX_DIR = "faiss_index"
INDEX_PATH = "faiss_index/faiss.index"
METADATA_PATH = "faiss_index/metadata.pkl"


# === Load model once ===
model = SentenceTransformer(MODEL_NAME)

# === Ensure output directory exists ===
os.makedirs(INDEX_DIR, exist_ok=True)


def embed_and_store(text: str, doc_id: str) -> bool:
    try:
        # ✅ Clean and split into sentences
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        if not sentences:
            raise ValueError("No valid sentences to embed.")

        embeddings = model.encode(sentences, convert_to_numpy=True)

        # ✅ Load or initialize FAISS index
        if os.path.exists(INDEX_PATH):
            index = faiss.read_index(INDEX_PATH)
        else:
            index = faiss.IndexFlatL2(embeddings.shape[1])  # 384 for MiniLM

        # ✅ Load or initialize metadata list
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "rb") as f:
                metadata = pickle.load(f)
                if not isinstance(metadata, list):
                    raise ValueError("Metadata must be a list.")
        else:
            metadata = []

        # ✅ Add embeddings to index
        index.add(embeddings)

        # ✅ Add metadata entries
        for sentence in sentences:
            metadata.append({
                "doc_id": doc_id,
                "chunk": sentence
            })

        # ✅ Save index and metadata
        faiss.write_index(index, INDEX_PATH)
        with open(METADATA_PATH, "wb") as f:
            pickle.dump(metadata, f)

        print(f"✅ Embedded {len(sentences)} chunks for doc_id: {doc_id}")
        return True

    except Exception as e:
        print(f"❌ Error in embed_and_store: {e}")
        return False


def search_faiss(query: str, top_k: int = 5, doc_id: Optional[str] = None) -> str:
    try:
        if not os.path.exists(INDEX_PATH) or not os.path.exists(METADATA_PATH):
            return "No documents available."

        index = faiss.read_index(INDEX_PATH)
        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)
            if not isinstance(metadata, list) or not isinstance(metadata[0], dict):
                raise ValueError("Metadata is not a valid list of dictionaries.")

        query_embedding = model.encode([query], convert_to_numpy=True)
        D, I = index.search(np.array(query_embedding).astype("float32"), top_k * 3)

        results = []
        for idx in I[0]:
            if idx >= len(metadata):
                continue
            entry = metadata[idx]
            if doc_id and entry.get("doc_id") != doc_id:
                continue
            results.append(entry["chunk"])
            if len(results) >= top_k:
                break

        if not results:
            return "No relevant content found in the documents."

        return "\n".join(results)

    except Exception as e:
        print(f"❌ Error in search_faiss: {e}")
        return "Search failed due to an internal error."
