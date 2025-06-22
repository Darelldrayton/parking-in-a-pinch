from django.core.management.base import BaseCommand
from apps.notifications.services import NotificationTemplateService


class Command(BaseCommand):
    help = 'Create default notification templates'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating notification templates...'))
        
        try:
            count = NotificationTemplateService.create_default_templates()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully processed {count} notification templates'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating templates: {str(e)}')
            )