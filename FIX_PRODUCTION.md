# 🔑 Fix Production Deployment - Add Environment Variables

## ⚠️ Problem
The production deployment is failing because **environment variables are not configured in Vercel**.

**Error:** "Unable to find air quality data for this area"

**Cause:** The OpenAQ API key (`VITE_OPENAQ_API_KEY`) is missing in Vercel production environment.

---

## ✅ Solution: Add Environment Variables to Vercel

### **Method 1: Using Vercel CLI (Fastest)** ⚡

Run these commands in your terminal:

```powershell
# Set OpenAQ API Key
vercel env add VITE_OPENAQ_API_KEY

# When prompted:
# 1. Paste your OpenAQ API key
# 2. Select environments: Production, Preview, Development (all 3)
# 3. Press Enter

# Set Gemini API Key (if you have one)
vercel env add GEMINI_API_KEY

# When prompted:
# 1. Paste your Gemini API key
# 2. Select environments: Production, Preview, Development (all 3)
# 3. Press Enter
```

After adding environment variables, redeploy:
```powershell
vercel --prod
```

---

### **Method 2: Using Vercel Dashboard (Visual)** 🌐

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/sathyaseelan2006s-projects/megam/settings/environment-variables

2. **Add Environment Variables:**

   **Variable 1: OpenAQ API Key**
   ```
   Key:   VITE_OPENAQ_API_KEY
   Value: [Your OpenAQ API Key - Get from https://explore.openaq.org/]
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **Variable 2: Gemini API Key** (Optional - for AI explanations)
   ```
   Key:   GEMINI_API_KEY
   Value: [Your Gemini API Key - Get from https://aistudio.google.com/]
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

3. **Redeploy:**
   - Click "Redeploy" button in Vercel dashboard
   - OR run `vercel --prod` in terminal

---

## 🔑 How to Get API Keys

### **OpenAQ API Key** (REQUIRED)
1. Visit: https://explore.openaq.org/
2. Click "Sign Up" (top-right)
3. Create free account
4. Go to: https://explore.openaq.org/api-keys
5. Click "Generate API Key"
6. Copy the key (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

**API Key Example:**
```
1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### **Gemini API Key** (OPTIONAL - for AI features)
1. Visit: https://aistudio.google.com/
2. Sign in with Google account
3. Click "Get API Key"
4. Create new API key
5. Copy the key (format: `AIzaSy...`)

---

## 📋 Quick Setup Script

Copy and paste this entire block into PowerShell:

```powershell
# Add OpenAQ API Key
Write-Host "🔑 Adding OpenAQ API Key to Vercel..." -ForegroundColor Cyan
$openaqKey = Read-Host "Enter your OpenAQ API Key"
echo $openaqKey | vercel env add VITE_OPENAQ_API_KEY production preview development

# Add Gemini API Key (optional)
$addGemini = Read-Host "Do you want to add Gemini API Key? (y/n)"
if ($addGemini -eq 'y') {
    $geminiKey = Read-Host "Enter your Gemini API Key"
    echo $geminiKey | vercel env add GEMINI_API_KEY production preview development
}

# Redeploy
Write-Host "🚀 Redeploying to production..." -ForegroundColor Green
vercel --prod

Write-Host "✅ Done! Check your deployment." -ForegroundColor Green
```

---

## 🔍 Verify Environment Variables

Check if environment variables are set:

```powershell
vercel env ls
```

Expected output:
```
Environment Variables for sathyaseelan2006s-projects/megam

  Name                    Value        Environments
  VITE_OPENAQ_API_KEY     1a2b***      Production, Preview, Development
  GEMINI_API_KEY          AIza***      Production, Preview, Development
```

---

## 🧪 Test After Adding Keys

1. **Redeploy:** `vercel --prod`
2. **Open:** https://megam-kc8ebekek-sathyaseelan2006s-projects.vercel.app
3. **Test:** Search for "New York" and click the location
4. **Expected:** Should show air quality data (not error)

---

## 🔧 Troubleshooting

### **Error: "OpenAQ API key not configured"**
- Environment variable is not set in Vercel
- Solution: Run `vercel env add VITE_OPENAQ_API_KEY`

### **Error: "Unable to find air quality data"**
- API key might be invalid
- Solution: Check your API key at https://explore.openaq.org/api-keys

### **Error: "Network request failed"**
- Serverless function might be failing
- Solution: Check Vercel logs: `vercel logs`

### **Still not working?**
```powershell
# Check deployment logs
vercel logs --follow

# Check environment variables
vercel env ls

# Force fresh deployment
vercel --prod --force
```

---

## 📝 Environment Variables Needed

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `VITE_OPENAQ_API_KEY` | ✅ YES | OpenAQ ground station data | https://explore.openaq.org/api-keys |
| `GEMINI_API_KEY` | ❌ No | AI pollution explanations | https://aistudio.google.com/ |

---

## 🎯 Quick Fix Steps

**If you just want it working NOW:**

1. **Get OpenAQ API Key:** https://explore.openaq.org/api-keys (30 seconds)
2. **Run this:**
   ```powershell
   vercel env add VITE_OPENAQ_API_KEY
   # Paste your key when prompted
   # Select all environments
   vercel --prod
   ```
3. **Wait 1 minute** for deployment
4. **Test:** Open your Vercel URL and try clicking a location

---

## ✅ Success Criteria

After adding environment variables and redeploying, you should see:

✅ No "Unable to find air quality data" errors  
✅ Location data loads successfully  
✅ 🔮 Forecast button appears  
✅ ML training works (if you click forecast)  

---

## 📞 Need Help?

**Can't get API key?**
- OpenAQ is free, just sign up: https://explore.openaq.org/

**Vercel commands not working?**
- Make sure you're logged in: `vercel login`

**Still having issues?**
- Check Vercel deployment logs
- Verify API key is valid
- Try clearing cache: `vercel --prod --force`

---

**Once you add the environment variables, the production app will work exactly like your local development! 🎉**
