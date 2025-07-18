# embeddings/search_index.py

import os
import pickle
import faiss
import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
INDEX_PATH = "faiss_index/faiss.index"
METADATA_PATH = "faiss_index/metadata.pkl"


# Load model once
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

# === Search function ===
def search_faiss(query: str, doc_id: Optional[str] = None, top_k: int = 5) -> List[Dict]:
    """
    Perform semantic search with FAISS. If index or metadata is missing, return empty.
    """
    if not query.strip():
        return []

    # Check if index and metadata exist
    if not os.path.exists(INDEX_PATH) or not os.path.exists(METADATA_PATH):
        print("⚠️ FAISS index or metadata not found.")
        return []

    try:
        index = faiss.read_index(INDEX_PATH)
        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)

        if not isinstance(metadata, list) or not isinstance(metadata[0], dict):
            print("❌ Metadata format is invalid. Expected list of dictionaries.")
            return []

        # Embed query
        query_embedding = model.encode([query])
        D, I = index.search(np.array(query_embedding).astype("float32"), top_k * 3)

        results = []
        for idx in I[0]:
            if idx < len(metadata):
                entry = metadata[idx]
                if not doc_id or entry.get("doc_id") == doc_id:
                    results.append(entry)
                if len(results) >= top_k:
                    break

        return results

    except Exception as e:
        print(f"❌ FAISS search error: {e}")
        return []
