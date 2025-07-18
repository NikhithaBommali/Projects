import sys
import os
import pickle
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ✅ Fix for OpenAI SDK v1+
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Add project root to path for absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from embeddings.search_index import search_faiss


def is_greeting(query: str) -> bool:
    return query.lower().strip() in ["hi", "hii", "hello", "hey", "hola", "namaste"]


def get_answer(query: str, doc_id: str = None) -> str:
    try:
        if is_greeting(query):
            return "Hello! 👋 I'm your assistant. Ask me anything related to the uploaded documents."

        if len(query.strip()) < 3:
            return "Your question is too short. Please provide a more complete query."

        # Step 1: Search uploaded documents
        results = search_faiss(query, doc_id=doc_id)

        top_chunks = [
            res.get("text") or res.get("chunk")
            for res in results[:4]
            if res.get("text") or res.get("chunk")
        ]
        context = "\n".join(top_chunks).strip()

        if context and len(context.split()) > 20:  # ✅ Only use if there's enough meaningful content
            system_prompt = (
                "You are a helpful and medically informed AI assistant.\n\n"
                "Instructions:\n"
                "- Use the document context provided to answer the user's question.\n"
                "- Only answer based on the document context.\n"
                "- If the context does not help, say: 'No relevant information found in uploaded documents.'\n"
                "- Be clear, short, and friendly."
            )

            user_prompt = f"""Context:
\"\"\"{context}\"\"\"

User Question: {query}"""
        else:
            # 🛑 No useful content found — fallback to general knowledge
            system_prompt = (
                "You are a knowledgeable and helpful assistant.\n\n"
                "Answer the user's question based on your general knowledge."
            )
            user_prompt = query

        # GPT-4 generation
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=300
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"An error occurred while processing your question: {str(e)}"
