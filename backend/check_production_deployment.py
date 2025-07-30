#!/usr/bin/env python
import os
import sys

print("Checking deployment paths and file versions...")
print("=" * 60)

# Check if our changes are deployed to production
production_paths = [
    "/var/www/parking-in-a-pinch/backend/apps/users/admin_views.py",
    "/opt/backend/apps/users/admin_views.py"
]

for path in production_paths:
    if os.path.exists(path):
        print(f"\n📁 Found: {path}")
        
        # Check for our fixes
        with open(path, 'r') as f:
            content = f.read()
            
        # Check for JSONRenderer import
        has_json_renderer = "from rest_framework.renderers import JSONRenderer" in content
        has_renderer_class = "renderer_classes = [JSONRenderer]" in content
        has_filter_backends = "filter_backends = []" in content
        has_pagination_class = "pagination_class = None" in content
        
        print(f"  ✅ JSONRenderer import: {has_json_renderer}")
        print(f"  ✅ renderer_classes: {has_renderer_class}")
        print(f"  ✅ filter_backends fix: {has_filter_backends}")
        print(f"  ✅ pagination_class fix: {has_pagination_class}")
        
        if not all([has_json_renderer, has_renderer_class, has_filter_backends, has_pagination_class]):
            print("  ⚠️  Some fixes are missing!")
        else:
            print("  ✅ All fixes present")
    else:
        print(f"\n❌ Not found: {path}")

# Check if we're using the right path
current_path = os.getcwd()
print(f"\n📍 Current working directory: {current_path}")

# Check gunicorn config for the actual path
try:
    with open("/etc/systemd/system/parking-app.service", 'r') as f:
        service_content = f.read()
    print(f"\n📋 Service file excerpts:")
    for line in service_content.split('\n'):
        if 'WorkingDirectory' in line or 'ExecStart' in line:
            print(f"  {line}")
except Exception as e:
    print(f"\n❌ Could not read service file: {e}")