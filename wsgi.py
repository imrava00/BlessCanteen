"""
WSGI entry point for PythonAnywhere deployment
"""

import sys
import os

# Add the project directory to Python path
# This will be: /home/<your-username>/school-cafe
project_dir = os.path.dirname(os.path.abspath(__file__))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

# Set environment to production
os.environ['FLASK_ENV'] = 'production'

# Import the Flask application
from app import app as application

# PythonAnywhere requires the WSGI file to export 'application' variable
# We import 'app' from app.py and alias it as 'application'
