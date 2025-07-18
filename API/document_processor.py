import fitz  # PyMuPDF

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from a .pdf or .txt file using PyMuPDF (fitz).
    Raises an error if no text is found or the file is unsupported.
    """
    try:
        if file_path.endswith(".pdf"):
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()

            if not text.strip():
                raise ValueError("No text found in PDF.")

            return text.strip()

        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read().strip()

        else:
            raise ValueError("Unsupported file format. Only .pdf and .txt are supported.")

    except Exception as e:
        raise ValueError(f"Failed to extract text from file: {e}")
