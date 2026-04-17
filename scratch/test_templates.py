
import os
from fastapi.templating import Jinja2Templates
from fastapi import Request
from starlette.datastructures import URL

# Mock request
class MockRequest:
    def __init__(self):
        self.scope = {
            "type": "http",
            "server": ("testserver", 80),
            "path": "/",
            "headers": [],
        }
    def url_for(self, name, **path_params):
        return f"/{name}/{path_params.get('path', '')}"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

try:
    print(f"Checking templates in: {TEMPLATES_DIR}")
    # We can't easily mock the full Request object for Jinja2 without more starlette internals,
    # but we can check if the file is found.
    res = templates.get_template("index.html")
    print("Template successfully found and loaded!")
except Exception as e:
    print(f"Error: {e}")
