# Generated manually for adding admin verification fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_verified',
            field=models.BooleanField(default=False, help_text='Whether user has been manually verified by admin (shows verification badge)', verbose_name='verified user'),
        ),
        migrations.AddField(
            model_name='user',
            name='verified_at',
            field=models.DateTimeField(blank=True, help_text='When the user was verified by admin', null=True, verbose_name='verified at'),
        ),
        migrations.AddField(
            model_name='user',
            name='verified_by',
            field=models.ForeignKey(blank=True, help_text='Admin who verified this user', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_users', to='users.user'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['is_verified'], name='users_user_is_verified_idx'),
        ),
    ]