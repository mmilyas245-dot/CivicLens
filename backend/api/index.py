import sys
import os

# Add the parent folder to path so Python can import main.py and other modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI instance from your main.py file
from backend import app