# Fix: API Connection Issues

## Current Status
✅ **Backend is running** on port 3000 (process ID: 11872)
❌ **Frontend may not be running** or there's a connection issue

## Solution Steps

### 1. Make Sure Frontend is Running

Open a **new terminal** and run:
```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8080/
```

### 2. Test Backend Connection

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

### 3. Check Browser Console

1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Look for the API base URL log: `🔗 API Base URL: http://localhost:3000/api/v1/`
4. Check for any error messages

### 4. Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Look for requests to `http://localhost:3000/api/v1/auth/login`
5. Check the status code:
   - **200** = Success ✅
   - **404** = Route not found
   - **500** = Server error
   - **CORS error** = CORS configuration issue
   - **Failed/Blocked** = Connection refused (backend not running)

### 5. Common Issues & Fixes

#### Issue: "Cannot connect to backend server"
**Fix:** Make sure backend is running:
```bash
cd ms-backend-offerave
npm run dev
```

#### Issue: CORS Error
**Fix:** The backend already allows `http://localhost:8080`. If you're using a different port, update `ms-backend-offerave/.env`:
```env
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

#### Issue: 404 Not Found
**Fix:** Check that the API route exists. The login endpoint should be:
```
POST http://localhost:3000/api/v1/auth/login
```

#### Issue: 500 Server Error
**Fix:** Check backend terminal for error messages. Common issues:
- Database connection failed
- Missing environment variables
- Invalid request data

### 6. Verify Everything is Working

1. ✅ Backend running on port 3000
2. ✅ Frontend running on port 8080
3. ✅ Backend health check works: `http://localhost:3000/health`
4. ✅ Browser console shows correct API URL
5. ✅ Network requests go to `http://localhost:3000/api/v1/...`

### 7. Test Login

Try logging in again. If it still fails:
1. Check the Network tab for the exact error
2. Check the backend terminal for error logs
3. Check browser console for error messages

## Quick Diagnostic Commands

```bash
# Check if backend is running
netstat -ano | findstr :3000

# Check if frontend is running  
netstat -ano | findstr :8080

# Test backend health
curl http://localhost:3000/health
```

## Still Not Working?

1. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start backend: `cd ms-backend-offerave && npm run dev`
   - Start frontend: `npm run dev`

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R
   - Or clear cache in DevTools

3. **Check firewall:**
   - Make sure Windows Firewall isn't blocking ports 3000 or 8080

4. **Check for multiple Node processes:**
   ```bash
   Get-Process -Name node
   ```
   Kill any unnecessary processes if needed.
