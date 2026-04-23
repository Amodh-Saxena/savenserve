from pymongo import MongoClient
import os

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "food_db"

client = MongoClient(MONGODB_URL)
mongo_db = client[DATABASE_NAME]

def get_mongo_db():
    return mongo_db
