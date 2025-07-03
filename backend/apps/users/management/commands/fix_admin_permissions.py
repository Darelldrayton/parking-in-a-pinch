"""
Django management command to fix admin permissions for the production user.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix admin permissions for darelldrayton93@gmail.com user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='darelldrayton93@gmail.com',
            help='Email address of the user to make admin (default: darelldrayton93@gmail.com)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes'
        )

    def handle(self, *args, **options):
        email = options['email']
        dry_run = options['dry_run']
        
        self.stdout.write("=" * 60)
        self.stdout.write("🔧 FIXING ADMIN PERMISSIONS")
        self.stdout.write("=" * 60)
        
        try:
            # Find the user
            user = User.objects.get(email=email)
            self.stdout.write(f"✅ Found user: {user.email} (ID: {user.id})")
            
            # Display current status
            self.stdout.write(f"\n📋 CURRENT STATUS:")
            self.stdout.write(f"   Email: {user.email}")
            self.stdout.write(f"   Username: {user.username}")
            self.stdout.write(f"   First Name: {user.first_name}")
            self.stdout.write(f"   Last Name: {user.last_name}")
            self.stdout.write(f"   Is Active: {user.is_active}")
            self.stdout.write(f"   Is Staff: {user.is_staff}")
            self.stdout.write(f"   Is Superuser: {user.is_superuser}")
            self.stdout.write(f"   User Type: {user.user_type}")
            self.stdout.write(f"   Email Verified: {user.is_email_verified}")
            
            # Check what needs to be changed
            changes_needed = []
            if not user.is_staff:
                changes_needed.append("Set is_staff=True")
            if not user.is_superuser:
                changes_needed.append("Set is_superuser=True")
            if not user.is_active:
                changes_needed.append("Set is_active=True")
            if user.user_type not in ['BOTH', 'HOST']:
                changes_needed.append(f"Change user_type from '{user.user_type}' to 'BOTH'")
            
            if not changes_needed:
                self.stdout.write(f"\n✅ No changes needed - user already has proper admin permissions!")
                return
            
            self.stdout.write(f"\n🔄 CHANGES NEEDED:")
            for change in changes_needed:
                self.stdout.write(f"   - {change}")
            
            if dry_run:
                self.stdout.write(f"\n⚠️  DRY RUN: No changes were made")
                self.stdout.write(f"   Run without --dry-run to apply changes")
                return
            
            # Apply changes
            with transaction.atomic():
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                if user.user_type not in ['BOTH', 'HOST']:
                    user.user_type = 'BOTH'
                user.save()
            
            self.stdout.write(f"\n✅ SUCCESS: Admin permissions updated!")
            
            # Verify changes
            user.refresh_from_db()
            self.stdout.write(f"\n📋 UPDATED STATUS:")
            self.stdout.write(f"   Is Staff: {user.is_staff}")
            self.stdout.write(f"   Is Superuser: {user.is_superuser}")
            self.stdout.write(f"   Is Active: {user.is_active}")
            self.stdout.write(f"   User Type: {user.user_type}")
            
            # Test admin access
            self.stdout.write(f"\n🧪 TESTING ADMIN ACCESS:")
            total_users = User.objects.count()
            self.stdout.write(f"   Total users in database: {total_users}")
            
            if total_users > 0:
                self.stdout.write(f"✅ Database has data - admin dashboard should now work!")
            else:
                self.stdout.write(f"⚠️  Database appears empty - this might indicate a different issue")
                
        except User.DoesNotExist:
            self.stdout.write(f"❌ ERROR: User with email '{email}' not found")
            self.stdout.write(f"\n🔍 Available users:")
            for user in User.objects.all()[:10]:
                self.stdout.write(f"   - {user.email} (ID: {user.id})")
                
        except Exception as e:
            self.stdout.write(f"❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
        
        self.stdout.write(f"\n" + "=" * 60)