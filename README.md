# Food Redistribution System

A full-stack, production-ready web application connecting food donors with NGOs to redistribute surplus food, preventing food waste. Features role-based dashboards, machine learning placeholders for NOVA classification and spoilage prediction, and a beautiful modern React UI.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python), Firebase (Auth & Firestore)
- **Infra**: Local Development

## Features
- **Donors**: Add surplus food listings with quantities, location, and expiry dates.
- **NGOs**: Browse available local food donations safely and efficiently, and accept donations.
- **Admin**: Monitor users and system overview.
- **Beautiful UI**: Modern, responsive layout with Framer Motion page transitions and green/orange sustainability-focused styling.

## Running the Application

### Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)

### Backend Setup
1. Navigate to the `backend` directory.
2. Ensure you have your Firebase `serviceAccountKey.json` in the `backend/app` folder.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Development
- To modify the frontend, edit `frontend/src`.
- To modify the backend or ML algorithms, edit `backend/app`.
