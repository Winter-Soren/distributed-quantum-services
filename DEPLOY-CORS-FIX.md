# CORS Fix Deployment - Caddy Configuration

## 🎯 Root Cause

**The Caddy reverse proxy was overriding FastAPI's CORS configuration**, returning a hardcoded single origin that didn't match the requesting origin.

**Error:**
```
Access-Control-Allow-Origin: https://distributed-quantum.com
```

**But browser was requesting from:**
```
https://www.distributed-quantum.com (with www)
```

**The `Access-Control-Allow-Origin` header MUST exactly match the requesting origin.**

## ✅ What Was Fixed

Modified `deploy/Caddyfile` to:
1. Match requests from **both** `www.distributed-quantum.com` AND `distributed-quantum.com`
2. Return the **requesting origin** in the response (dynamic, not hardcoded)
3. Handle preflight OPTIONS requests correctly for each origin
4. Support localhost for development

## 📋 Deployment Steps

### On AWS Lightsail Instance:

```bash
# Step 1: Navigate to project
cd ~/nodes-quantum-gates

# Step 2: Pull latest changes (includes new Caddyfile)
git pull origin main

# Step 3: Restart Caddy to load new configuration
sudo docker compose restart caddy

# Step 4: Wait for Caddy to reload (5 seconds)
sleep 5

# Step 5: Test CORS for www origin
curl -I -X OPTIONS \
  -H "Origin: https://www.distributed-quantum.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.distributed-quantum.com/api/v1/pharma/submit

# Step 6: Test CORS for non-www origin
curl -I -X OPTIONS \
  -H "Origin: https://distributed-quantum.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.distributed-quantum.com/api/v1/pharma/submit
```

## ✨ Expected Results

### For www origin (Step 5):
```
HTTP/2 204
access-control-allow-origin: https://www.distributed-quantum.com
access-control-allow-credentials: true
```

### For non-www origin (Step 6):
```
HTTP/2 204
access-control-allow-origin: https://distributed-quantum.com
access-control-allow-credentials: true
```

**The returned origin MUST match the requested origin!**

## 🧪 Browser Test

After deployment, test in browser at `https://www.distributed-quantum.com/pharma/submit`:

1. Open DevTools (F12) → Console
2. Submit a form
3. Should see **NO CORS errors**
4. Request should succeed: `POST https://api.distributed-quantum.com/api/v1/pharma/submit 200 OK`

## 🔧 Troubleshooting

### Issue: Still seeing CORS error after restart

**Check Caddy logs:**
```bash
sudo docker compose logs caddy | tail -50
```

**Verify Caddyfile was loaded:**
```bash
sudo docker compose exec caddy cat /etc/caddy/Caddyfile | grep -A 10 "cors_www"
```

**Force complete restart:**
```bash
sudo docker compose down
sudo docker compose up -d
```

### Issue: 404 on CSS file

This is a separate issue (Next.js build/deployment). The CORS fix addresses the API call error only.

## 📊 Verification Checklist

- [ ] Git pulled latest changes
- [ ] Caddy container restarted
- [ ] CORS test for www returns matching origin
- [ ] CORS test for non-www returns matching origin
- [ ] Browser console shows no CORS errors
- [ ] API POST request succeeds

## 🎓 Technical Explanation

### Why Caddy Was the Problem

1. **FastAPI CORS middleware** was correctly configured with both origins
2. **But Caddy sits in front of FastAPI** as a reverse proxy
3. **Caddy was adding its own CORS headers** that overrode FastAPI's
4. **Caddy was using a single hardcoded origin** from `FRONTEND_DOMAIN` env var

### The Fix

Caddy now:
- **Matches the requesting Origin header**
- **Returns that same origin** in `Access-Control-Allow-Origin`
- **Supports multiple origins** (www, non-www, localhost)

This is called "**origin reflection**" - the server echoes back the requesting origin if it's in the allowed list.

### Why Not Remove Caddy CORS?

Option 1: Remove Caddy CORS, let FastAPI handle it
- ✅ Simpler configuration
- ❌ Requires removing all Caddy CORS directives
- ❌ FastAPI CORS only works if request reaches FastAPI

Option 2: Configure Caddy CORS properly (chosen)
- ✅ Works at proxy layer (faster)
- ✅ Consistent with existing architecture
- ✅ Handles preflight before reaching backend
- ❌ Slightly more complex config

## 🚀 Quick Deploy Command

```bash
cd ~/nodes-quantum-gates && \
git pull origin main && \
sudo docker compose restart caddy && \
sleep 5 && \
curl -I -X OPTIONS \
  -H "Origin: https://www.distributed-quantum.com" \
  -H "Access-Control-Request-Method: POST" \
  https://api.distributed-quantum.com/api/v1/pharma/submit | grep -i "access-control-allow-origin"
```

Should output:
```
access-control-allow-origin: https://www.distributed-quantum.com
```

Done! 🎉
