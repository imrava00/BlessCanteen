#!/bin/bash
# School Cafe - PythonAnywhere Quick Setup Script
# Run this in your PythonAnywhere Bash console

set -e  # Exit on error

echo "🚀 School Cafe - PythonAnywhere Setup"
echo "======================================"

# Get username
USERNAME=$(whoami)
echo "Username: $USERNAME"

# Create directories
echo ""
echo "📁 Creating required directories..."
mkdir -p ~/school-cafe/uploads
mkdir -p ~/school-cafe/static
mkdir -p ~/school-cafe/templates

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd ~/school-cafe
pip install --user -r requirements.txt

# Set permissions
echo ""
echo "🔒 Setting permissions..."
chmod 755 ~/school-cafe/uploads
chmod 644 ~/school-cafe/app.py
chmod 644 ~/school-cafe/wsgi.py

# Create uploads directory placeholder
touch ~/school-cafe/uploads/.gitkeep

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to Web tab and click 'Reload'"
echo "2. Visit: https://$USERNAME.pythonanywhere.com/"
echo ""
echo "If you see errors, check the Error Log in the Web tab."
