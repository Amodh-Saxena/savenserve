import json
import urllib.request
import urllib.parse
from fastapi import HTTPException

# Mappls (MapmyIndia) Credentials
CLIENT_ID = "96dHZVzsAuvMtxCNqNhmmYq6BYo2RtVoMJm6_gXWkNNKI92jXtvS-yAI0r1Jpm70XWMbL_uh587Vj0L3C-cQEQ=="
CLIENT_SECRET = "lrFxI-iSEg-O1Vz5pqESeDTlQrObfIvWsW9peQsKpRopvSaIfA0vZESjZLRd6_R5tuoo7vcHEPaNkPZYVy3V1Wtd7XvzP2f9"

def get_mappls_token() -> str:
    """ Authenticats with MapmyIndia outposts to retrieve a temporary access Bearer token """
    url = "https://outpost.mapmyindia.com/api/security/oauth/token"
    
    data = urllib.parse.urlencode({
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get('access_token')
    except Exception as e:
        print("Mappls Token Error:", e)
        return None

def geocode_address(address: str):
    """ Converts a raw address text into precise lat/lng coordinates using direct OpenStreetMap Nominatim APIs """
    if not address or address.strip() == "":
        return None, None
        
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "FoodRedistributionApp/1.0"}
    
    parts = [p.strip() for p in address.split(',') if p.strip()]
    
    try:
        # Iteratively try searching by removing the most specific parts (e.g. "Apt 4B")
        for i in range(len(parts)):
            query = ", ".join(parts[i:])
            params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
            full_url = f"{url}?{params}"
            
            req = urllib.request.Request(full_url, headers=headers)
            try:
                with urllib.request.urlopen(req) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode())
                        if data and len(data) > 0:
                            return float(data[0]['lat']), float(data[0]['lon'])
            except Exception as e:
                print(f"Geocoding request error: {e}")
                pass
    except Exception as e:
        print(f"Geocoding error: {e}")
        pass
    
    return None, None
