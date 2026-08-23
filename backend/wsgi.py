"""
WSGI configuration for PythonAnywhere deployment
This file tells PythonAnywhere how to run your Flask application
"""

import sys
import os

# Add the project directory to Python path
# Update this path to match your actual project location on PythonAnywhere
project_home = '/home/your-username/BlessCanteen'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Change to the project directory
os.chdir(project_home)

# Import the Flask application
from app import app as application

# For PythonAnywhere, the application variable must be named 'application'
# This is already done in the import above
