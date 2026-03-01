# WindailyBud Render Deployment Guide

## Architecture
- **Frontend**: Static Site on Render (React build)
- **Backend**: Web Service on Render (FastAPI/Python)
- **Database**: MongoDB Atlas (external)

---

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster (e.g., `windailybud-cluster`)
3. Create a database user:
   - Database Access → Add New Database User
   - Username: `windailybud_user`
   - Password: (generate a strong password, save it!)
4. Network Access → Add IP Address → **Add 0.0.0.0/0** (allows Render to connect)
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://windailybud_user:<password>@cluster.xxxxx.mongodb.net/windailybud?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password

---

## Step 2: Push Code to GitHub

1. Create a new GitHub repository (e.g., `windailybud`)
2. Push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - WindailyBud"
   git remote add origin https://github.com/YOUR_USERNAME/windailybud.git
   git push -u origin main
   ```

---

## Step 3: Deploy Backend FIRST (Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `windailybud-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3` ⚠️ **SET THIS EXPLICITLY** (Render may auto-detect Node)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. Add **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `MONGO_URL` | `mongodb+srv://windailybud_user:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/windailybud?retryWrites=true&w=majority` |
   | `DB_NAME` | `windailybud` |
   | `JWT_SECRET` | `your-random-secret-string-here` (generate a long random string) |
   | `CORS_ORIGINS` | `*` (or your frontend domain after deploy) |

6. Click **Create Web Service**
7. Wait for deploy to complete
8. **Note your backend URL**: `https://windailybud-api.onrender.com` (needed for Step 4)

---

## Step 4: Deploy Frontend (Static Site)

1. Go to Render Dashboard
2. Click **New → Static Site**
3. Connect the same GitHub repo
4. Configure:
   - **Name**: `windailybud`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

5. Add **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `REACT_APP_BACKEND_URL` | `https://windailybud-api.onrender.com` (your backend URL from Step 3) |

6. Click **Create Static Site**
7. Wait for deploy to complete

### ⚠️ IMPORTANT: Add Rewrite Rule After Deployment

This is **CRITICAL** for React Router to work (without it, refreshing any page shows 404):

1. Go to your Static Site → **Redirects/Rewrites**
2. Add a new rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
3. Save

Your app is now live at: `https://windailybud.onrender.com`

---

## Step 5: Update CORS (Recommended)

After frontend is deployed, update backend's `CORS_ORIGINS`:
1. Go to your backend service on Render
2. Environment → Edit `CORS_ORIGINS`
3. Set to: `https://windailybud.onrender.com`
4. Save and redeploy

---

## Step 6: Custom Domain (Optional)

1. On the **Static Site** → Settings → Custom Domains → Add your domain
2. In your domain registrar's DNS settings:
   - `www` → CNAME → `windailybud.onrender.com`
   - `@` (root) → A record → `216.24.57.1`
3. Wait 5-15 mins for SSL certificate provisioning

---

## ⚠️ Common Mistakes to Avoid

1. **Don't use `render.yaml` Blueprint** — manually create Web Service + Static Site
2. **Don't use `pip freeze` for requirements.txt** — only list packages the app actually uses
3. **Set Runtime to Python explicitly** — Render may auto-detect Node
4. **Don't forget the Rewrite Rule** — React SPA routing breaks without it
5. **Backend must be deployed FIRST** — frontend needs its URL as an env variable

---

## Troubleshooting

### Backend not starting?
- Check the logs in Render dashboard
- Ensure `MONGO_URL` is correct (test connection in MongoDB Compass first)
- Make sure MongoDB Atlas has `0.0.0.0/0` in Network Access

### Frontend can't connect to backend?
- Verify `REACT_APP_BACKEND_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend CORS_ORIGINS allows your frontend domain

### Database connection issues?
- Verify MongoDB Atlas cluster is running
- Check username/password in connection string
- Ensure IP whitelist includes `0.0.0.0/0`

---

## Environment Variables Summary

### Backend (.env equivalent on Render)
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/windailybud?retryWrites=true&w=majority
DB_NAME=windailybud
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
CORS_ORIGINS=https://windailybud.onrender.com
```

### Frontend (Build-time on Render)
```
REACT_APP_BACKEND_URL=https://windailybud-api.onrender.com
```

---

## Post-Deployment Checklist

- [ ] Backend health check works: `https://windailybud-api.onrender.com/api/health`
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Todos can be created and viewed
- [ ] Habits are seeded on new user registration
- [ ] Analytics page loads data

---

## Custom Domain (Optional)

1. In Render, go to your Static Site → Settings → Custom Domains
2. Add your domain (e.g., `windailybud.com`)
3. Update DNS records as instructed
4. Update `CORS_ORIGINS` on backend to include your custom domain
