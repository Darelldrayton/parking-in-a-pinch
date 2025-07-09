#!/usr/bin/env python3
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.disputes.models import Dispute
from apps.messaging.models import Conversation, Message, MessageReadStatus
from apps.users.models import User
from django.db.models import Q

def check_messages():
    user = User.objects.first()
    if not user:
        print("No users found in the database")
        return
        
    print(f'Checking messages for user: {user.email}')
    
    # Count all conversations
    all_convos = Conversation.objects.filter(participants=user).count()
    print(f'\nTotal conversations for user: {all_convos}')
    
    # Count by type
    for conv_type in ['direct', 'booking', 'inquiry', 'support']:
        count = Conversation.objects.filter(participants=user, conversation_type=conv_type).count()
        print(f'  - {conv_type}: {count}')
    
    # Check all disputes where user is involved
    as_complainant = Dispute.objects.filter(complainant=user).count()
    as_respondent = Dispute.objects.filter(respondent=user).count()
    print(f'\nDisputes as complainant: {as_complainant}')
    print(f'Disputes as respondent: {as_respondent}')
    
    # Check if there are disputes without conversations
    disputes_without_conv = Dispute.objects.filter(
        Q(complainant=user) | Q(respondent=user),
        conversation__isnull=True
    ).count()
    print(f'\nDisputes without conversations: {disputes_without_conv}')
    
    # Check all conversations regardless of type
    all_conversations = Conversation.objects.all().count()
    print(f'\nTotal conversations in system: {all_conversations}')
    
    # Check if user is participant in all support conversations
    support_convs = Conversation.objects.filter(conversation_type='support')
    print(f'\nTotal support conversations: {support_convs.count()}')
    not_participant_count = 0
    for conv in support_convs:
        if user not in conv.participants.all():
            not_participant_count += 1
            print(f'  ✗ User NOT participant in: {conv.title[:50]}')
            # Check who are the participants
            participants = conv.participants.all()
            print(f'    Participants: {", ".join([p.email for p in participants])}')
    
    if not_participant_count == 0:
        print('  ✓ User is participant in all support conversations')
    else:
        print(f'\n  User is NOT participant in {not_participant_count} support conversations')
    
    # Check unread messages more carefully
    print('\n\nDetailed unread message check:')
    
    # Method 1: Using the model method
    total_unread_method1 = 0
    for conv in Conversation.objects.filter(participants=user):
        unread = conv.get_unread_count(user)
        if unread > 0:
            total_unread_method1 += unread
            print(f'  - {conv.title[:50]}: {unread} unread')
    
    print(f'\nTotal unread (using get_unread_count): {total_unread_method1}')
    
    # Method 2: Direct query
    unread_messages = Message.objects.filter(
        conversation__participants=user,
        is_deleted=False
    ).exclude(
        sender=user
    ).exclude(
        id__in=MessageReadStatus.objects.filter(user=user).values_list('message_id', flat=True)
    )
    
    print(f'\nTotal unread (direct query): {unread_messages.count()}')
    
    # Show some unread messages
    print('\nFirst 5 unread messages:')
    for msg in unread_messages[:5]:
        print(f'  - From: {msg.sender.email}')
        print(f'    In: {msg.conversation.title[:50]}')
        print(f'    Content: {msg.content[:100]}')
        print(f'    Created: {msg.created_at}')
        print()

if __name__ == "__main__":
    check_messages()