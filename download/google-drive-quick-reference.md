# 🚀 Google Drive Setup - Quick Reference Card

## ⚡ 5-Minute Setup (Copy-Paste Guide)

### 1️⃣ Create Project & Enable API
```
🌐 Go to: https://console.cloud.google.com/
   → Click "NEW PROJECT"
   → Name: School-Cafe-Drive
   → Click "CREATE"

📚 Then: https://console.cloud.google.com/apis/library
   → Search: "Google Drive API"
   → Click "ENABLE"
```

### 2️⃣ Create Service Account
```
👤 Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   → Click "+ CREATE SERVICE ACCOUNT"
   → Name: school-cafe-uploader
   → Click "CREATE AND CONTINUE" ×2
   → Click "DONE"

🔑 Then click on the service account you created:
   → Go to "KEYS" tab
   → Click "ADD KEY" → "Create new key"
   → Select "JSON"
   → Click "CREATE" (downloads automatically)
```

### 3️⃣ Install Credentials
```
📁 Rename downloaded file to: credentials.json

💾 Copy to your project:
   /home/z/my-project/school-cafe/credentials.json
```

### 4️⃣ Test It!
```bash
cd /home/z/my-project/school-cafe
python test_google_drive.py
```

**Expected output:** ✅ SUCCESS! Connected to Google Drive API

---

## 🔗 Direct Links (Click These!)

| Step | Link |
|------|------|
| **Cloud Console Home** | https://console.cloud.google.com/ |
| **Create Project** | https://console.cloud.google.com/projectcreate |
| **Enable Drive API** | https://console.cloud.google.com/apis/library/drive.googleapis.com |
| **Service Accounts** | https://console.cloud.google.com/iam-admin/serviceaccounts |
| **API Dashboard** | https://console.cloud.google.com/apis/dashboard |

---

## ✅ Success Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] Service account created (`school-cafe-uploader`)
- [ ] JSON key downloaded
- [ ] File renamed to `credentials.json`
- [ ] File placed in `/home/z/my-project/school-cafe/`
- [ ] Test script shows "SUCCESS!"

---

## 🎯 What You'll Get After Setup

When users upload payment proofs:

```
Your Google Drive/
└── School Cafe Payment Proofs/    ← Auto-created folder
    └── 2026/                      ← Year folder
        └── August/                ← Month folder
            ├── WK-260822_20260824_143022_payment.jpg
            ├── WK-260823_20260825_091533_transfer.png
            └── ...
```

**Features:**
✅ Automatic folder organization by year/month  
✅ Files named with order number + timestamp  
✅ Viewable links returned in API response  
✅ Local backup kept in `uploads/` folder  
✅ Public link sharing enabled (anyone with link can view)  

---

## ❓ Common Issues & Fixes

| Error | Fix |
|-------|-----|
| `credentials.json not found` | Place file in `/home/z/my-project/school-cafe/` |
| `Invalid credentials` | Re-download JSON key from Cloud Console |
| `API not enabled` | Enable Google Drive API (Step 1) |
| `Access denied` | Check service account permissions |

---

## 📞 Need Help?

**Full guide:** `/home/z/my-project/download/google-drive-setup-guide.md`  
**Test script:** `python /home/z/my-project/school-cafe/test_google_drive.py`

---

## 🔐 Security Notes

⚠️ **Never commit `credentials.json` to Git!**

Add this to `.gitignore`:
```gitignore
credentials.json
uploads/*.jpg
uploads/*.png
uploads/*.pdf
*.db
```

🔄 **Rotate keys every 90 days** for best security

---

**Ready? Start with Step 1 above! You'll be done in 5 minutes.** 🚀
