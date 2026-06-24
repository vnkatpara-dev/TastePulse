import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

print("Loading vectorizer...")
vectorizer = joblib.load("tfidf_vectorizer.pkl")
print(type(vectorizer))
print("Vocabulary length:", len(vectorizer.vocabulary_))
print("Has idf_:", hasattr(vectorizer, "idf_"))
try:
    X = vectorizer.transform(["good food"])
    print("Transform successful")
except Exception as e:
    print("Transform failed:", e)
