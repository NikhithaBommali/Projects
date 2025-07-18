import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load data
df = pd.read_csv("data/disease_symptoms.csv")

# Step 1: Clean & tokenize symptoms
df['Symptoms'] = df['Symptoms'].str.lower().str.split(', ')

# Step 2: Get all unique symptoms
all_symptoms = sorted(set(symptom for symptoms in df['Symptoms'] for symptom in symptoms))

# Step 3: Create one-hot encoded features for symptoms
for symptom in all_symptoms:
    df[symptom] = df['Symptoms'].apply(lambda x: int(symptom in x))

# Step 4: Prepare features and labels
X = df[all_symptoms]
y = df['Disease']

# Step 5: Train model
model = RandomForestClassifier()
model.fit(X, y)

# Step 6: Save model and symptom list
with open("model.pkl", "wb") as f:
    pickle.dump((model, all_symptoms), f)

print("✅ Model trained and saved as model.pkl")
