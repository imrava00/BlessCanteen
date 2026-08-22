# Google Drive Integration Setup Guide
## For School Cafe Payment Proof Storage

This guide will walk you through setting up Google Cloud credentials so that payment proof uploads are automatically stored in your Google Drive.

---

## 📋 Prerequisites
- A Google account (Gmail address)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## 🔧 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click on project dropdown (top left)
   - Click **"NEW PROJECT"**
   - Project name: `School-Cafe-Drive` (or any name you prefer)
   - Click **"CREATE"**

### Step 2: Enable Google Drive API

1. **Navigate to API Library**
   - In left sidebar, go to **"APIs & Services"** → **"Library"**
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search and Enable Drive API**
   - Search for: **"Google Drive API"**
   - Click on it
   - Click **"ENABLE"** button
   - Wait for it to enable (usually takes 30 seconds)

### Step 3: Create Service Account

1. **Go to Service Accounts Page**
   - Navigate to **"APIs & Services"** → **"Credentials"**
   - Or visit: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Click **"+ CREATE SERVICE ACCOUNT"**

2. **Service Account Details**
   - **Service account name**: `school-cafe-uploader`
   - **Service account ID**: `school-cafe-uploader` (auto-generated, can keep as is)
   - **Description**: `Uploads payment proofs to Google Drive`
   - Click **"CREATE AND CONTINUE"**

3. **Skip Granting Permissions (for now)**
   - Click **"CONTINUE"** (skip step 2)
   - Click **"DONE"** (skip step 3)

### Step 4: Create Service Account Key (Download Credentials)

1. **Find Your Service Account**
   - You should see `school-cafe-uploader` listed
   - Click on it to open details

2. **Create Key**
   - Go to **"KEYS"** tab
   - Click **"ADD KEY"** → **"Create new key"**
   - Select **"JSON"** (important!)
   - Click **"CREATE"**

3. **Download & Save**
   - A JSON file will download automatically
   - **Rename it to**: `credentials.json`
   - **Keep it safe!** This contains sensitive access keys

---

## 📁 Step 5: Install in Your Project

### Option A: For Local Development / Testing

1. **Copy credentials.json to school-cafe folder**
   ```bash
   # Copy your downloaded credentials.json to:
   /home/z/my-project/school-cafe/credentials.json
   ```

2. **Verify File Location**
   ```
   school-cafe/
   ├── app.py
   ├── credentials.json          ← Place here!
   ├── templates/
   ├── static/
   └── uploads/
   ```

### Option B: For PythonAnywhere Deployment

1. **Upload via PythonAnywhere Dashboard**
   - Go to PythonAnywhere dashboard → **"Files"**
   - Navigate to your school-cafe folder
   - Upload `credentials.json` there

2. **Set Correct Permissions**
   - The file should be readable by your web app
   - No special permissions needed (default is fine)

---

## 🌐 Step 6: Share Google Drive Folder with Service Account

**Important!** By default, service accounts have their own "invisible" Drive. To save files to YOUR Google Drive:

### Option 1: Use Service Account's Own Drive (Easiest)
- Files will be stored in the service account's drive
- You'll access them via the links returned by the API
- **No extra setup needed!**

### Option 2: Save to Your Personal Drive (Recommended)

1. **Get Service Account Email**
   - Open your `credentials.json` file
   - Find the `client_email` field
   - It looks like: `school-cafe-uploader@your-project-id.iam.gserviceaccount.com`

2. **Share a Folder with Service Account**
   - Create a folder in your Google Drive named: **"School Cafe Payment Proofs"**
   - Right-click folder → **"Share"**
   - Enter the service account email from above
   - Permission: **"Editor"** (allows upload)
   - Click **"Send"**

---

## ✅ Step 7: Test the Setup

### Test with Flask App

```bash
cd /home/z/my-project/school-cafe

# Start Flask app
python app.py
```

Then:
1. Open http://localhost:5000
2. Place an order
3. Upload payment proof
4. Check if it says "Uploaded to Google Drive!"

### Test via Command Line

```python
# Quick test script
from app import get_google_drive_service

with app.app_context():
    service = get_google_drive_service()
    if service:
        print("✅ Google Drive connected successfully!")
    else:
        print("❌ Failed to connect - check credentials")
```

---

## 🔍 Troubleshooting

### Error: "credentials not found"
- **Cause**: `credentials.json` not in correct location
- **Fix**: Ensure file is in `/home/z/my-project/school-cafe/credentials.json`

### Error: "access denied" or "forbidden"
- **Cause**: Drive API not enabled or wrong permissions
- **Fix**: 
  1. Verify Drive API is enabled in Cloud Console
  2. Check service account has Editor permission on folder

### Error: "google libraries not installed"
- **Fix**: Install required packages:
  ```bash
  pip install google-api-python-client google-auth
  ```

### Files uploading but not appearing in Drive
- **Cause**: Service account has its own Drive space
- **Fix**: Check the `web_view_link` in response, or share folder with service account

---

## 🛡️ Security Best Practices

1. **Never commit credentials.json to Git**
   - Add to `.gitignore`: `credentials.json`

2. **Restrict Key Access**
   - Only give Editor permission to necessary folders
   - Don't use "Owner" permission

3. **Regular Rotation**
   - Rotate keys every 90 days (Cloud Console → Keys → Delete + Create new)

4. **Monitor Usage**
   - Check Google Cloud Console → APIs & Services → Quotas
   - Monitor for unusual activity

---

## 📊 What Happens After Setup

When a user uploads payment proof:

1. **File saved locally** (backup) → `uploads/payment_xxx.jpg`
2. **File uploaded to Google Drive** → Organized folders:
   ```
   School Cafe Payment Proofs/
   └── 2026/
       └── August/
           ├── WK-260822_20260824_143022_payment.jpg
           ├── WK-260823_20260825_091533_transfer.png
           └── ...
   ```
3. **Database updated** with both local path + Drive link
4. **Response includes** viewable link to Drive file

---

## 🆘 Need Help?

If you encounter issues:
1. Check the Flask console output for error messages
2. Verify all steps above were completed
3. Check Google Cloud Console for API errors

---

**Ready?** Follow Steps 1-5 above, then let me know when you've downloaded `credentials.json` and I'll help you test it! 🚀
