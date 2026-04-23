from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FoodListingBase(BaseModel):
    title: str
    quantity: str
    expiry_date: datetime
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    image_url: Optional[str] = None

class FoodListingCreate(FoodListingBase):
    pass

class FoodListingResponse(FoodListingBase):
    id: str
    donor_id: str
    status: Optional[str] = "pending"
    created_at: datetime

    class Config:
        from_attributes = True

class FoodListingUpdate(BaseModel):
    status: str
