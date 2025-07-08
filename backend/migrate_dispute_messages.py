#!/usr/bin/env python3
"""
Script to migrate existing DisputeMessage entries to the messaging system.
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.disputes.models import Dispute, DisputeMessage
from apps.messaging.models import Message
from django.utils import timezone

def migrate_dispute_messages():
    """Migrate existing DisputeMessage entries to the messaging system."""
    
    # Get all dispute messages that haven't been migrated yet
    dispute_messages = DisputeMessage.objects.all().order_by('created_at')
    
    print(f"Found {dispute_messages.count()} dispute messages to migrate")
    
    migrated_count = 0
    skipped_count = 0
    
    for dm in dispute_messages:
        try:
            # Get or create conversation for this dispute
            if not dm.dispute.conversation:
                print(f"⚠️ Dispute {dm.dispute.dispute_id} has no conversation, skipping...")
                skipped_count += 1
                continue
                
            conversation = dm.dispute.conversation
            
            # Check if this message already exists in the messaging system
            existing_message = Message.objects.filter(
                conversation=conversation,
                sender=dm.sender,
                content=dm.message,
                created_at__date=dm.created_at.date()
            ).first()
            
            if existing_message:
                print(f"⏭️ Message already exists in conversation, skipping...")
                skipped_count += 1
                continue
            
            # Add sender to conversation if not already a participant
            if dm.sender not in conversation.participants.all():
                conversation.participants.add(dm.sender)
                print(f"➕ Added {dm.sender.email} to conversation")
            
            # Create message in the messaging system
            message = Message.objects.create(
                conversation=conversation,
                sender=dm.sender,
                content=dm.message,
                created_at=dm.created_at,
                message_type='system' if dm.is_internal else 'text'
            )
            
            print(f"✅ Migrated message from {dm.sender.email}: {dm.message[:50]}...")
            migrated_count += 1
            
        except Exception as e:
            print(f"❌ Error migrating message {dm.id}: {e}")
            skipped_count += 1
    
    print(f"\n🎉 Migration complete!")
    print(f"✅ Migrated: {migrated_count} messages")
    print(f"⏭️ Skipped: {skipped_count} messages")

if __name__ == "__main__":
    migrate_dispute_messages()