#!/usr/bin/env python3
"""
Script to create conversations for existing disputes.
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.disputes.models import Dispute

def create_conversations():
    disputes_without_conversations = Dispute.objects.filter(conversation__isnull=True)
    
    print(f"Found {disputes_without_conversations.count()} disputes without conversations")
    
    created_count = 0
    for dispute in disputes_without_conversations:
        try:
            conversation = dispute.get_or_create_conversation()
            if conversation:
                print(f"✅ Created conversation {conversation.conversation_id} for dispute {dispute.dispute_id}")
                created_count += 1
            else:
                print(f"⚠️ Failed to create conversation for dispute {dispute.dispute_id}")
        except Exception as e:
            print(f"❌ Error creating conversation for dispute {dispute.dispute_id}: {e}")
    
    print(f"🎉 Successfully created {created_count} conversations")

if __name__ == "__main__":
    create_conversations()