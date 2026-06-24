import json
import joblib
from sklearn.metrics import confusion_matrix

print("Loading test data...")
with open("test_data.json", "r") as f:
    test_data = json.load(f)

texts = [item["text"] for item in test_data]
y_test = [item["sentiment"] for item in test_data]

print("Loading model and vectorizer...")
vectorizer = joblib.load("tfidf_vectorizer.pkl")
model = joblib.load("restaurant_sentiment_model.pkl")

print("Transforming test data...")
X_test = vectorizer.transform(texts)


print("Predicting...")
y_pred = model.predict(X_test)

print("Calculating confusion matrix...")
cm = confusion_matrix(y_test, y_pred, labels=["negative", "positive"])

print("\n--- Confusion Matrix ---")
print("                Predicted")
print("               Neg    Pos")
print(f"Actual Neg: {cm[0][0]:6d} {cm[0][1]:6d}")
print(f"       Pos: {cm[1][0]:6d} {cm[1][1]:6d}")
print("------------------------\n")

from sklearn.metrics import classification_report, accuracy_score

print("\n--- Evaluation Metrics ---")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, digits=4))
print("------------------------\n")
