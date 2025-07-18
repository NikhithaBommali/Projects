# predict.py

from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pickle
import os
from deps import get_current_user

# === Constants ===
MODEL_PATH = "model.pkl"

# === Training logic === (only run if model not saved)
def train_and_save_model():
    X = np.array([
        [1, 3, 6, 2],
        [2, 4, 1, 5],
        [3, 2, 5, 1],
        [4, 5, 2, 3],
        [5, 1, 4, 6],
        [6, 6, 3, 4],
    ])
    y = np.array([0, 1, 0, 1, 0, 1])

    model = RandomForestClassifier()
    model.fit(X, y)

    # Save model (add symptom list or feature names if needed)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print("✅ Model trained and saved to model.pkl")

# === Load model ===
def load_model():
    if not os.path.exists(MODEL_PATH):
        train_and_save_model()
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    return model

# === Predict using features ===
def make_prediction(features: list):
    """
    Accepts a list of numeric features, returns predicted label and confidence.
    """
    model = load_model()
    prediction = model.predict([features])[0]
    confidence = max(model.predict_proba([features])[0])
    return str(prediction), float(confidence)

# === Run check ===
if __name__ == "__main__":
    test_features = [3, 4, 2, 1]
    result, conf = make_prediction(test_features)
    print(f"Predicted: {result} (Confidence: {conf:.2f})")
