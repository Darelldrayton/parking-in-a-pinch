#!/usr/bin/env python
import os
import django
import sys

# Setup Django
sys.path.append('/opt/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

# Check the last error in Django logs
import subprocess

print("Checking Django service logs for errors...")
print("=" * 60)

# Get the last 50 lines of the service log
result = subprocess.run(
    ['journalctl', '-u', 'parking-app.service', '-n', '50', '--no-pager'],
    capture_output=True,
    text=True
)

# Filter for error messages related to admin/users
lines = result.stdout.split('\n')
for i, line in enumerate(lines):
    if '500' in line or 'ERROR' in line or 'admin/users' in line or 'Traceback' in line:
        # Print context around the error
        start = max(0, i - 3)
        end = min(len(lines), i + 10)
        for j in range(start, end):
            if j == i:
                print(f">>> {lines[j]}")
            else:
                print(f"    {lines[j]}")
        print("-" * 60)