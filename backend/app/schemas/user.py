from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    donor = "donor"
    ngo = "ngo"
    admin = "admin"

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    name: Optional[str] = None
    location: Optional[str] = None
    contact_number: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None
