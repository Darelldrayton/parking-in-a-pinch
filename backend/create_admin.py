#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check for existing admin user
users = User.objects.filter(username='admin')
print(f'Found {users.count()} users with username admin')

if users.exists():
    admin = users.first()
    print(f'  - Email: {admin.email}, Is superuser: {admin.is_superuser}, Is active: {admin.is_active}')
    admin.email = 'admin@test.com'
    admin.set_password('admin123')
    admin.is_superuser = True
    admin.is_staff = True
    admin.is_active = True
    admin.save()
    print('Updated existing admin user')
else:
    admin = User.objects.create_superuser(email='admin@test.com', username='admin', password='admin123')
    admin.first_name = 'Admin'
    admin.last_name = 'User'
    admin.save()
    print('Created new admin user')

print(f'Admin user ready - Email: admin@test.com, Password: admin123')