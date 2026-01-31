# API Troubleshooting Guide

## Issue: All API requests are failing

### Step 1: Check if Backend Server is Running

The backend server must be running on port 3000. To start it:

```bash
cd ms-backend-offerave
npm install  # If you haven't installed dependencies
npm run dev  # Start the development server
```

You should see:
```
🚀 Server running on port 3000 in development mode
📡 API available at http://localhost:3000/api/v1
```

### Step 2: Verify Backend .env File

Make sure you have a `.env` file in the `ms-backend-offerave` directory with:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

### Step 3: Check Frontend API Configuration

The frontend is configured to use `http://localhost:3000/api/v1/` by default.

To verify, check the browser console - you should see the baseURL logged.

### Step 4: Test Backend Health Endpoint

Open your browser and go to:
```
http://localhost:3000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "development"
}
```

### Step 5: Check CORS Configuration

The backend allows requests from:
- `http://localhost:8080` (Vite default)
- `http://localhost:5173` (Vite alternative)

Make sure your frontend is running on one of these ports.

### Generate Offer from Website

The AI offer generation feature tries the backend first. If the backend is unavailable (not running, connection refused, timeout), it automatically falls back to a Supabase Edge Function. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`) are set in your frontend `.env` for the fallback to work. If both fail, you'll see a clear error message.

### Common Issues:

1. **Backend not running**: Start the backend server first (or rely on Supabase fallback for offer generation)
2. **Wrong port**: Backend should be on port 3000, frontend on 8080 or 5173
3. **CORS errors**: Check browser console for CORS-related errors
4. **Database connection**: Make sure MongoDB connection string is correct in .env
5. **Missing .env file**: Create .env file in ms-backend-offerave directory

### Quick Fix Commands:

```bash
# Terminal 1: Start Backend
cd ms-backend-offerave
npm run dev

# Terminal 2: Start Frontend
npm run dev
```

### Verify Connection:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Check if requests are going to `http://localhost:3000/api/v1/auth/login`
5. Check the response status and error messages
