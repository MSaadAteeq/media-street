# How to Start the Backend Server

## Quick Start

1. **Open a new terminal/command prompt**

2. **Navigate to the backend directory:**
   ```bash
   cd ms-backend-offerave
   ```

3. **Start the backend server:**
   ```bash
   npm run dev
   ```

   Or if you don't have nodemon:
   ```bash
   npm start
   ```

4. **You should see:**
   ```
   ✅ .env file loaded from: ...
   🚀 Server running on port 3000 in development mode
   📡 API available at http://localhost:3000/api/v1
   ```

5. **Keep this terminal open** - the server needs to keep running

## Verify Backend is Running

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

## Troubleshooting

### Port 3000 Already in Use

If you get an error that port 3000 is already in use:

1. Find what's using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Kill the process (replace PID with the process ID):
   ```bash
   taskkill /PID <PID> /F
   ```

3. Or change the port in `.env` file:
   ```env
   PORT=3001
   ```

   Then update frontend `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/v1/
   ```

### Database Connection Error

Make sure your `.env` file in `ms-backend-offerave` has the correct `MONGODB_URI`.

### CORS Errors

The backend is configured to allow requests from:
- `http://localhost:8080`
- `http://localhost:5173`

Make sure your frontend is running on one of these ports.

## After Starting Backend

1. The backend should be running on `http://localhost:3000`
2. The frontend should connect automatically
3. Try logging in again - it should work now!
