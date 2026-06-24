from datasets import load_dataset
import pandas as pd

dataset = load_dataset("yelp_polarity")
test_data = dataset["test"]
test_df = pd.DataFrame(test_data)
test_df["sentiment"] = test_df["label"].map({0: "negative", 1: "positive"})
test_df.to_json("test_data.json", orient="records")
print("Dumped test_data.json")
