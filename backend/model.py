from datasets import load_dataset
import pandas as pd

# Load dataset
dataset = load_dataset("yelp_polarity")

train_data = dataset["train"]
test_data = dataset["test"]

# Convert to pandas
train_df = pd.DataFrame(train_data)
test_df = pd.DataFrame(test_data)

# Convert labels: 0 → negative, 1 → positive
train_df["sentiment"] = train_df["label"].map({0: "negative", 1: "positive"})
test_df["sentiment"] = test_df["label"].map({0: "negative", 1: "positive"})

print(train_df.head())
# Balanced sampling (50k positive, 50k negative)

pos = train_df[train_df["sentiment"] == "positive"].sample(50000, random_state=42)
neg = train_df[train_df["sentiment"] == "negative"].sample(50000, random_state=42)

sample_df = pd.concat([pos, neg]).sample(frac=1, random_state=42)

print(sample_df["sentiment"].value_counts())

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, accuracy_score

# Features
vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1,2),
    stop_words="english"
)

X_train = vectorizer.fit_transform(sample_df["text"])
y_train = sample_df["sentiment"]

# Model
model = LinearSVC(class_weight="balanced")

model.fit(X_train, y_train)

print("Model trained successfully!")

# Use full test set (no sampling)

X_test = vectorizer.transform(test_df["text"])
y_test = test_df["sentiment"]

y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

import joblib

joblib.dump(model, "restaurant_sentiment_model.pkl")
joblib.dump(vectorizer, "tfidf_vectorizer.pkl")

print("Model and vectorizer saved!")
