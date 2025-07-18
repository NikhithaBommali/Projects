from PyPDF2 import PdfReader

def extract_text(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    elif file_path.endswith(".txt"):
        return open(file_path, "r").read()
    else:
        raise ValueError("Unsupported file format")
