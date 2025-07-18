import pickle
import pandas as pd
from schemas import PredictionInput
from embeddings.search_index import search_faiss

# === Load model and symptom list ===
with open("model.pkl", "rb") as f:
    loaded = pickle.load(f)

# 🛠 Handle if model.pkl contains just model or (model, all_symptoms)
try:
    model, all_symptoms = loaded
except ValueError:
    model = loaded
    # Load symptoms from a separate file if needed
    try:
        with open("symptom_list.txt") as sym_file:
            all_symptoms = [line.strip().lower() for line in sym_file if line.strip()]
    except FileNotFoundError:
        raise ValueError("❌ Could not load all_symptoms. Make sure it's in model.pkl or symptom_list.txt.")


# === Main Prediction Logic ===
def predict_disease(payload: PredictionInput, doc_id: str = None) -> dict:
    user_symptoms = [sym.strip().lower() for sym in payload.symptoms.split(',') if sym.strip()]

    if not user_symptoms:
        return {
            "riskLevel": "Unknown",
            "confidence": 0.0,
            "conditions": [{"name": "No valid symptoms provided", "risk": 0.0, "color": "gray"}],
            "recommendations": ["Please provide at least one valid symptom."]
        }

    query = "Symptoms: " + ", ".join(user_symptoms)

    # === Try FAISS search first ===
    try:
        context = search_faiss(query, doc_id=doc_id)

        # Check if context is a useful string (not chunks or raw data)
        if context and isinstance(context, str) and "No relevant" not in context:
            return {
                "riskLevel": "Medium",
                "confidence": 85.0,
                "conditions": [
                    {"name": "Likely condition based on documents", "risk": 85.0, "color": "yellow"}
                ],
                "recommendations": [
                    "Consult a specialist about the findings.",
                    "Follow up with more diagnostic tests."
                ]
            }

    except Exception as e:
        print(f"❌ FAISS search error: {e}")

    # === Fallback to trained model prediction ===
    try:
        features = [1 if symptom in user_symptoms else 0 for symptom in all_symptoms]
        features_df = pd.DataFrame([features], columns=all_symptoms)
        prediction = model.predict(features_df)[0]

        return {
            "riskLevel": "Medium",
            "confidence": 80.0,
            "conditions": [
                {"name": prediction, "risk": 80.0, "color": "yellow"}
            ],
            "recommendations": [
                f"Based on symptoms, you may have {prediction}.",
                "It is recommended to consult a healthcare provider for further evaluation."
            ]
        }

    except Exception as e:
        print(f"❌ Model prediction error: {e}")
        return {
            "riskLevel": "Unknown",
            "confidence": 0.0,
            "conditions": [{"name": "Prediction Failed", "risk": 0.0, "color": "gray"}],
            "recommendations": ["Could not make a prediction. Please try again."]
        }
