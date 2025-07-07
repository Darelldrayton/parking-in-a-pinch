"""
Management command to create conversations for existing disputes.
"""
from django.core.management.base import BaseCommand
from apps.disputes.models import Dispute


class Command(BaseCommand):
    help = 'Create conversations for existing disputes that don\'t have them'

    def handle(self, *args, **options):
        disputes_without_conversations = Dispute.objects.filter(conversation__isnull=True)
        
        self.stdout.write(f"Found {disputes_without_conversations.count()} disputes without conversations")
        
        created_count = 0
        for dispute in disputes_without_conversations:
            try:
                conversation = dispute.get_or_create_conversation()
                if conversation:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created conversation {conversation.conversation_id} for dispute {dispute.dispute_id}"
                        )
                    )
                    created_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f"Failed to create conversation for dispute {dispute.dispute_id}")
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error creating conversation for dispute {dispute.dispute_id}: {e}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {created_count} conversations")
        )