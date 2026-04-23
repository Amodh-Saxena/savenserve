import re
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from firebase_admin import firestore
from app.core.firebase_config import initialize_firebase
from app.schemas.food import FoodListingCreate, FoodListingResponse, FoodListingUpdate
from app.api.deps import get_current_user
from app.core.mongodb import get_mongo_db
from app.core.mappls import geocode_address

initialize_firebase()
db = firestore.client()
router = APIRouter()

@router.post("/", response_model=FoodListingResponse)
def create_food_listing(
    food_in: FoodListingCreate, 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "donor":
        raise HTTPException(status_code=403, detail="Only donors can create listings")
        
    final_lat = food_in.lat
    final_lng = food_in.lng
    
    # Strictly Geocode the provided text Address over implicit browser GPS coordinates
    if food_in.location:
        mc_lat, mc_lng = geocode_address(food_in.location)
        if mc_lat:
            final_lat = mc_lat
            final_lng = mc_lng

    food_data = {
        "donor_id": current_user["id"],
        "title": food_in.title,
        "quantity": food_in.quantity,
        "expiry_date": food_in.expiry_date.isoformat() if food_in.expiry_date else None,
        "location": food_in.location,
        "lat": final_lat,
        "lng": final_lng,
        "status": "pending",
        "image_url": food_in.image_url,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    # Add to Firestore
    doc_ref = db.collection("food_listings").document()
    doc_ref.set(food_data)
    
    # Mirror to MongoDB
    try:
        mongo_db = get_mongo_db()
        mongo_food_data = food_data.copy()
        mongo_food_data["_id"] = doc_ref.id
        # Remove or convert non-BSON types
        if "created_at" in mongo_food_data:
            mongo_food_data["created_at"] = datetime.utcnow()
        mongo_db.food_listings.insert_one(mongo_food_data)
    except Exception as mongo_err:
        print(f"MongoDB Mirror Error: {mongo_err}")
    
    food_data["id"] = doc_ref.id
    food_data["created_at"] = datetime.utcnow()
    return food_data

@router.get("/", response_model=List[FoodListingResponse])
def get_food_listings():
    listings_ref = db.collection("food_listings").order_by("expiry_date", direction=firestore.Query.ASCENDING)
    listings = []
    for doc in listings_ref.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        listings.append(data)
    return listings

@router.get("/stats")
def get_food_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view stats")
        
    listings_ref = db.collection("food_listings").stream()
    
    total_kgs_saved = 0.0
    total_items_saved = 0.0
    
    status_counts = {
        "pending": 0,
        "accepted": 0,
        "delivered": 0
    }
    
    for doc in listings_ref:
        data = doc.to_dict()
        
        status = data.get("status", "pending")
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts[status] = 1
            
        if status in ["accepted", "delivered"]:
            quantity_str = str(data.get("quantity", "0")).lower()
            match = re.search(r'[\d\.]+', quantity_str)
            if match:
                try:
                    val = float(match.group())
                    if "kg" in quantity_str:
                        total_kgs_saved += val
                    else:
                        total_items_saved += val
                except ValueError:
                    pass
                
    status_distribution = [
        {"name": k.capitalize(), "value": v} for k, v in status_counts.items() if v > 0
    ]
                
    return {
        "total_items_saved": total_items_saved,
        "total_kgs_saved": total_kgs_saved,
        "status_distribution": status_distribution
    }

@router.put("/{food_id}", response_model=FoodListingResponse)
def update_food_listing(
    food_id: str,
    food_in: FoodListingUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can accept listings")
    
    doc_ref = db.collection("food_listings").document(food_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Food listing not found")
        
    # Update the status
    doc_ref.update({"status": food_in.status})
    
    # Mirror update to MongoDB
    try:
        mongo_db = get_mongo_db()
        mongo_db.food_listings.update_one(
            {"_id": food_id},
            {"$set": {"status": food_in.status}}
        )
    except Exception as mongo_err:
        print(f"MongoDB Mirror Update Error: {mongo_err}")
    
    data = doc.to_dict()
    data["id"] = doc.id
    data["status"] = food_in.status
    return data
