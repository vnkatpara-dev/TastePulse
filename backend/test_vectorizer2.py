import joblib
print("Loading vectorizer...")
vectorizer = joblib.load("tfidf_vectorizer.pkl")
print([m for m in dir(vectorizer) if not m.startswith("_")])
