# Backend Image Proxy Server

Express.js server that proxies authenticated image requests from the frontend to the LMS API.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `/backend`
6. Add environment variable: `FRONTEND_URL=https://your-vercel-app.vercel.app`
7. Deploy!

### Option 2: Render
1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variable: `FRONTEND_URL=https://your-vercel-app.vercel.app`

### Option 3: Heroku
```bash
# Install Heroku CLI first
heroku login
heroku create your-app-name
git subtree push --prefix backend heroku main
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/media/:id` - Fetch image from LMS

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: *)
