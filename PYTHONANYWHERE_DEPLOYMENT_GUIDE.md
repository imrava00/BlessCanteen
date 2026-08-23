# 🚀 BlessCanteen - PythonAnywhere Deployment Guide

Complete step-by-step guide to deploy your BlessCanteen (Next.js + Flask) application on **PythonAnywhere**.

---

## 📋 Prerequisites

- ✅ PythonAnywhere account (**Free tier works**, but **Paid ($5/month)** recommended for production)
- ✅ Your project source code (the zip file)
- ✅ Basic knowledge of terminal/SSH

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           PythonAnywhere Server              │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Static Files   │  │   Flask API      │ │
│  │   (Next.js)      │  │   Backend        │ │
│  │                  │  │                  │ │
│  │  • index.html    │  │  /api/*          │ │
│  │  • _next/*       │  │  /admin/*        │ │
│  │  • images/*      │  │  /uploads/*      │ │
│  └─────────────────┘  └──────────────────┘ │
│                                             │
│  URL: yourusername.pythonanywhere.com        │
└─────────────────────────────────────────────┘
```

---

## 📦 Step 1: Prepare Your Local Project

### 1.1 Build Next.js for Static Export

```bash
# Navigate to your project folder
cd /path/to/BlessCanteen

# Install dependencies (if not already done)
npm install

# Build the static export
npm run build

# The output will be in the 'out' directory
ls -la out/
```

### 1.2 Verify Build Output

You should see these files in the `out/` directory:
```
out/
├── index.html
├── ordering.html
├── orders.html
├── admin-panel.html
├── _next/
│   ├── static/
│   │   ├── css/
│   │   └── chunks/
│   └── ...
└── ...
```

---

## 🌐 Step 2: Set Up PythonAnywhere Account

### 2.1 Create Account (if you don't have one)

1. Go to [https://www.pythonanywhere.com](https://www.pythonanywhere.com)
2. Click **"Create a free account"**
3. Choose your plan:
   - **Beginner (Free)**: Good for testing, limited CPU
   - **Professional ($5/mo)**: Recommended for business use!

### 2.2 Access Your Dashboard

After login, you'll see the **Dashboard** with:
- Consoles (Bash, Python, etc.)
- Web section
- Files section
- Tasks/Scheduled jobs
- Databases

---

## 📁 Step 3: Upload Files to PythonAnywhere

### Option A: Using PythonAnywhere's File Interface (Easiest)

1. Go to **Files** tab in PythonAnywhere dashboard
2. Navigate to your home directory: `/home/yourusername/`
3. Click **"Upload a file"** button
4. Upload your zip file: `BlessCanteen_SourceCode.zip`
5. Open a **Bash Console** and extract:

```bash
# Go to home directory
cd ~

# Create project directory
mkdir BlessCanteen && cd BlessCanteen

# Extract the uploaded zip file
# (Adjust path to where you uploaded it)
unzip ../BlessCanteen_SourceCode.zip

# List files to verify
ls -la
```

### Option B: Using Git (Recommended for ongoing development)

```bash
# In PythonAnywhere Bash console
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/bless-canteen.git BlessCanteen

# Enter project directory
cd BlessCanteen
```

### Option C: Pull from GitHub/GitLab

If your code is on GitHub:

```bash
cd ~
git clone https://github.com/yourusername/blesscanteen.git BlessCanteen
cd BlessCanteen
```

---

## 🔧 Step 4: Configure Flask Application

### 4.1 Update WSGI Configuration

In PythonAnywhere Bash console:

```bash
cd ~/BlessCanteen/upload/BlessCanteen_extracted/

# Edit the WSGI file
nano wsgi.py
```

Update the `project_home` variable:

```python
import sys
import os

# UPDATE THIS PATH to match your actual username!
project_home = '/home/YOUR_USERNAME_HERE/BlessCanteen/upload/BlessCanteen_extracted'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.chdir(project_home)

from app_production import application  # Use the production app!
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 4.2 Copy or Build Frontend Files

#### Option A: If you built locally (recommended):

```bash
# Create out directory if it doesn't exist
mkdir -p ~/BlessCanteen/upload/BlessCanteen_extracted/out

# Upload your 'out' folder contents via Files tab
# Or copy from another location
cp -r /path/to/local/out/* ~/BlessCanteen/upload/BlessCanteen_extracted/out/
```

#### Option B: Build on PythonAnywhere (requires Node.js setup):

```bash
# Install Node.js (if not available)
pip install nodeenv
nodeenv env
source env/bin/activate

# Install npm packages
cd ~/BlessCanteen
npm install

# Build static export
npm run build

# Copy output to Flask directory
cp -r out/* upload/BlessCanteen_extracted/out/
```

### 4.3 Create Required Directories

```bash
cd ~/BlessCanteen/upload/BlessCanteen_extracted/

# Create directories for uploads
mkdir -p uploads
mkdir -p static

# Set permissions
chmod 755 uploads
chmod 755 out
```

---

## 🐍 Step 5: Set Up Virtual Environment & Dependencies

### 5.1 Create Virtual Environment

```bash
cd ~/BlessCanteen/upload/BlessCanteen_extracted/

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### 5.2 Install Python Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install required packages
pip install flask flask-cors werkzeug pillow

# Verify installation
pip list | grep -i flask
```

Expected output should show:
```
Flask          3.x.x
flask-cors     4.x.x
Werkzeug       3.x.x
```

---

## 🌐 Step 6: Configure Web Application

### 6.1 Add New Web App

1. Go to **Web** tab in PythonAnywhere dashboard
2. Click **"Add a new web app"**
3. Choose **"Manual configuration"** (NOT Django!)
4. Select **Python version**: **Python 3.10+**
5. Click **Next**

### 6.2 Configure WSGI File

1. In the **Code** section, find **WSGI configuration file**
2. Click the link to edit it
3. Replace content with:

```python
import sys
import os

project_home = '/home/YOUR_USERNAME/BlessCanteen/upload/BlessCanteen_extracted'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.chdir(project_home)

from app_production import application
```

**Important:** Replace `YOUR_USERNAME` with your actual PythonAnywhere username!

### 6.3 Configure Virtual Environment Path

In the **Virtualenv** section:

1. Click the **"Enter path to virtualenv"** text box
2. Enter: `/home/YOUR_USERNAME/BlessCanteen/upload/BlessCanteen_extracted/venv`
3. Click the **blue checkmark** to save

### 6.4 Set Working Directory

In the **Source code** section:

1. Set path to: `/home/YOUR_USERNAME/BlessCanteen/upload/BlessCanteen_extracted`
2. This is where your `app_production.py` lives

---

## 🔄 Step 7: Reload and Test

### 7.1 Reload Web App

1. Scroll to top of **Web** page
2. Click the big green **Reload** button
3. Wait for "Reload complete" message

### 7.2 Test Your Site

Open your browser and visit:

```
https://YOUR_USERNAME.pythonanywhere.com/
```

You should see the BlessCanteen homepage! 🎉

### 7.3 Test API Endpoints

Test that APIs work:

```bash
# Test menu API
curl https://YOUR_USERNAME.pythonanywhere.com/api/menu

# Test categories
curl https://YOUR_USERNAME.pythonanywhere.com/api/categories
```

---

## 🔒 Step 8: Security & Production Settings

### 8.1 Change Secret Key

Edit `app_production.py` and set a secure secret key:

```python
import secrets

app.config['SECRET_KEY'] = secrets.token_hex(32)
```

Or set as environment variable in PythonAnywhere:

1. Go to **Web** tab → **Variables** section
2. Add new variable:
   - Key: `SECRET_KEY`
   - Value: `your-super-secret-key-here`

### 8.2 Enable HTTPS (Automatic!)

PythonAnywhere provides **free HTTPS** automatically! ✅

Your site will be accessible at:
- `https://YOUR_USERNAME.pythonanywhere.com/`

### 8.3 Custom Domain (Optional)

If you have your own domain (e.g., `blesscanteen.com`):

1. Go to **Web** tab
2. Scroll to **Domains** section
3. Click **Add new domain**
4. Enter your domain name
5. Follow DNS configuration instructions shown

---

## 📊 Step 9: Database Setup

SQLite database is created automatically on first run!

```bash
# Check database was created
ls -l ~/BlessCanteen/upload/BlessCanteen_extracted/*.db

# Default admin login:
# Email: admin@blesscanteen.com
# Password: admin123
```

⚠️ **IMPORTANT:** Change the default admin password after first login!

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### ❌ "502 Bad Gateway"
**Cause:** Application crashed or not running properly

**Solution:**
1. Check error logs: **Web** tab → **Log files** → View logs
2. Common fixes:
   - Fix syntax errors in `app_production.py`
   - Ensure all imports are correct
   - Check virtual environment has required packages

#### ❌ "404 Not Found" on pages
**Cause:** Static files not found or routing issue

**Solution:**
1. Verify `out/` directory exists and contains `index.html`
2. Check file permissions: `chmod -R 755 out/`
3. Ensure paths in `app_production.py` are correct

#### ❌ "Internal Server Error" on API calls
**Cause:** Database or code error

**Solution:**
1. Check server logs for detailed error
2. Ensure SQLite can write to directory
3. Run manually to test:
   ```bash
   cd ~/BlessCanteen/upload/BlessCanteen_extracted/
   source venv/bin/activate
   python app_production.py
   ```

#### ❌ Uploads not working
**Cause:** Directory permissions

**Solution:**
```bash
chmod 777 ~/BlessCanteen/upload/BlessCanteen_extracted/uploads/
```

#### ❌ "ModuleNotFoundError: No module named 'flask'"
**Cause:** Virtual environment not activated or packages missing

**Solution:**
```bash
cd ~/BlessCanteen/upload/BlessCanteen_extracted/
source venv/bin/activate
pip install flask flask-cors werkzeug
# Then reload web app
```

---

## 💰 Pricing Comparison

| Feature | Free Tier | Professional ($5/mo) |
|---------|-----------|---------------------|
| **CPU Time** | 100 hrs/day | Unlimited |
| **Disk Space** | 512 MB | 1 GB+ |
| **Custom Domain** | ❌ No | ✅ Yes |
| **HTTPS** | ✅ Yes | ✅ Yes |
| **Background Tasks** | Limited | More |
| **Support** | Community | Priority |
| **For Business?** | ⚠️ Testing only | ✅ Recommended |

**Recommendation:** Use **Free tier for testing**, upgrade to **$5/mo for production canteen business**!

---

## 🚀 Quick Deploy Checklist

Before going live, verify:

- [ ] All files uploaded correctly
- [ ] Virtual environment created and packages installed
- [ ] WSGI file configured with correct paths
- [ ] Web app pointing to right location
- [ ] Database created successfully
- [ ] Admin login working (`admin@blesscanteen.com` / `admin123`)
- [ ] Menu items displaying
- [ ] Order creation working
- [ ] Payment proof upload functional
- [ ] Admin dashboard accessible
- [ ] HTTPS enabled (automatic)
- [ ] Changed default admin password!

---

## 📞 Getting Help

### Resources:
- **PythonAnywhere Docs:** [help.pythonanywhere.com](https://help.pythonanywhere.com/)
- **Flask Documentation:** [flask.palletsprojects.com](https://flask.palletsprojects.com/)
- **Community Forums:** [pythonanywhere forums](https://www.pythonanywhere.com/forums/)

### Support Contacts:
- **PythonAnywhere Support:** support@pythonanywhere.com
- **Project Issues:** Check your repository issues

---

## 🎉 You're Live!

Once deployed, your canteen ordering system will be live at:

```
https://YOUR_USERNAME.pythonanywhere.com/
```

Share this link with students/staff to start taking orders! 

**Congratulations on launching BlessCanteen!** 🍽️✨

---

*Last Updated: August 2026*
*Version: 1.0*
