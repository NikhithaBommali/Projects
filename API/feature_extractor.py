# D:\study\Disease-Prediction\API\feature_extractor.py

from schemas import PredictionInput

def extract_features(payload: PredictionInput):
    # Example feature conversion logic – adjust according to your model's needs
    gender_map = {"male": 0, "female": 1, "other": 2}

    features = [
        int(payload.age),
        gender_map.get(payload.gender.lower(), -1),
        len(payload.symptoms.split(",")),  # e.g., count symptoms
        len(payload.medical_history.split(",")),
        int(payload.lifestyle.smoking),
        int(payload.lifestyle.drinking),
        int(payload.lifestyle.exercise),
        int(payload.lifestyle.stress),
        int(payload.vitals.heart_rate) if payload.vitals.heart_rate else 0,
        float(payload.vitals.temperature) if payload.vitals.temperature else 0.0,
        float(payload.vitals.weight) if payload.vitals.weight else 0.0,
    ]
    return [features]
