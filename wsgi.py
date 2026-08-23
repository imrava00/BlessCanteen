"""
WSGI entry point for PythonAnywhere deployment
"""

import sys
import os

# Add the project directory to path
sys.path.insert(0, '/home/BlessCanteen/school-cafe')

# Set environment
os.environ['FLASK_ENV'] = 'production'

from app import app as application

if __name__ == '__main__':
    application.run()
