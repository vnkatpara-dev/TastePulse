import joblib

# Load model and vectorizer
model = joblib.load("restaurant_sentiment_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

print("Model loaded successfully!")
def predict_sentiment(text):
    text = text.lower()
    text_vector = vectorizer.transform([text])
    prediction = model.predict(text_vector)[0]
    return prediction
while True:
    review = input("\nEnter a restaurant review (or type 'exit'): ")
    
    if review.lower() == "exit":
        break
    
    result = predict_sentiment(review)
    print("Predicted Sentiment:", result)
