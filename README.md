# SpaceSense

**Understand Your Space. Reimagine Your World.**

SpaceSense is an AI-powered room intelligence, spatial scanning, and interior design platform built with React Native (Expo), Node.js/Express/MongoDB, and a Python FastAPI computer vision & spatial analysis service.

---

## Architecture Overview

1. **`mobile/` — React Native (Expo, JavaScript/JSX)**
   - User interface, navigation, camera & native AR scanning (via Expo Development Builds), 2D SVG floor plans, 3D digital twin (Three.js + `expo-gl`), interactive furniture placement studio, and AR preview.
2. **`backend/` — Node.js + Express + MongoDB**
   - REST API, JWT authentication, project & room storage, furniture catalog, saved design layouts, and orchestration of AI jobs.
3. **`ai-service/` — Python + FastAPI**
   - Object detection (YOLOv8), image processing (OpenCV), room geometry/spatial analysis, and structured layout recommendations.

---

## Project Structure

```
SpaceSense/
├── mobile/          # React Native Expo application (JavaScript / JSX)
├── backend/         # Express.js + Mongoose REST API
├── ai-service/      # Python FastAPI computer vision & AI service
├── README.md
└── .gitignore
```

---

## Development Prerequisites

- **Node.js** (v20+ recommended; tested with v24.14.1)
- **MongoDB** (local Community Server or MongoDB Atlas)
- **Python** (3.11–3.14)
- **Android Studio & Android SDK** (for Android Emulator and local Expo Development Builds)
- **Physical ARCore/ARKit Device** (required for real AR plane detection & depth scanning; Expo Go does not support native AR modules)

---

## Quick Start (Phase 1 Foundation)

### 1. Mobile App
```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

### 2. Backend API
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. AI Service
```bash
cd ai-service
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Development Milestones

- **Phase 1:** Technical feasibility assessment & project foundation *(Current)*
- **Phase 2:** Authentication & user profile setup
- **Phase 3:** Room project management (dashboard, create/list/detail)
- **Phase 4:** Manual room builder & 2D SVG floor plan
- **Phase 5:** Native AR foundation (Expo Dev Build + `@reactvision/react-viro`)
- **Phase 6:** Intelligent room scanner & geometry reconstruction
- **Phase 7:** Computer vision & AI furniture detection
- **Phase 8:** Interactive 3D digital twin (`expo-gl` + Three.js)
- **Phase 9:** Interior design studio & collision/boundary engine
- **Phase 10:** AI room design assistant
- **Phase 11:** AR furniture placement
- **Phase 12:** Room analytics, polish, testing & documentation
