# Generated by Django 4.2.8 on 2025-06-18 07:14

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationTemplate",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("booking", "Booking"),
                            ("payment", "Payment"),
                            ("reminder", "Reminder"),
                            ("emergency", "Emergency"),
                            ("marketing", "Marketing"),
                            ("system", "System"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "channel",
                    models.CharField(
                        choices=[
                            ("email", "Email"),
                            ("sms", "SMS"),
                            ("push", "Push Notification"),
                            ("in_app", "In-App Notification"),
                        ],
                        max_length=20,
                    ),
                ),
                ("subject_template", models.CharField(blank=True, max_length=200)),
                ("content_template", models.TextField()),
                ("html_template", models.TextField(blank=True)),
                (
                    "variables",
                    models.JSONField(
                        default=list, help_text="List of variables used in template"
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("urgent", "Urgent"),
                        ],
                        default="medium",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "notification_templates",
                "unique_together": {("name", "channel")},
            },
        ),
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("email_enabled", models.BooleanField(default=True)),
                ("email_address", models.EmailField(blank=True, max_length=254)),
                ("email_verified", models.BooleanField(default=False)),
                ("sms_enabled", models.BooleanField(default=False)),
                ("phone_number", models.CharField(blank=True, max_length=20)),
                ("phone_verified", models.BooleanField(default=False)),
                ("push_notifications", models.BooleanField(default=True)),
                ("booking_notifications", models.BooleanField(default=True)),
                ("payment_notifications", models.BooleanField(default=True)),
                ("reminder_notifications", models.BooleanField(default=True)),
                ("emergency_notifications", models.BooleanField(default=True)),
                ("marketing_notifications", models.BooleanField(default=False)),
                ("system_notifications", models.BooleanField(default=True)),
                ("quiet_hours_enabled", models.BooleanField(default=False)),
                ("quiet_hours_start", models.TimeField(default="22:00")),
                ("quiet_hours_end", models.TimeField(default="08:00")),
                ("timezone", models.CharField(default="UTC", max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_preferences",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "notification_preferences",
            },
        ),
        migrations.CreateModel(
            name="PushSubscription",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("endpoint", models.URLField()),
                ("p256dh_key", models.TextField()),
                ("auth_key", models.TextField()),
                ("user_agent", models.TextField(blank=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("device_info", models.JSONField(blank=True, default=dict)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="push_subscriptions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "push_subscriptions",
                "unique_together": {("user", "endpoint")},
            },
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "channel",
                    models.CharField(
                        choices=[
                            ("email", "Email"),
                            ("sms", "SMS"),
                            ("push", "Push Notification"),
                            ("in_app", "In-App Notification"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("booking", "Booking"),
                            ("payment", "Payment"),
                            ("reminder", "Reminder"),
                            ("emergency", "Emergency"),
                            ("marketing", "Marketing"),
                            ("system", "System"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("urgent", "Urgent"),
                        ],
                        default="medium",
                        max_length=10,
                    ),
                ),
                ("subject", models.CharField(blank=True, max_length=200)),
                ("content", models.TextField()),
                ("html_content", models.TextField(blank=True)),
                ("recipient", models.CharField(max_length=200)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sent", "Sent"),
                            ("delivered", "Delivered"),
                            ("failed", "Failed"),
                            ("read", "Read"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("external_id", models.CharField(blank=True, max_length=200)),
                ("external_status", models.CharField(blank=True, max_length=50)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("variables", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("failed_at", models.DateTimeField(blank=True, null=True)),
                ("error_message", models.TextField(blank=True)),
                ("retry_count", models.IntegerField(default=0)),
                ("max_retries", models.IntegerField(default=3)),
                (
                    "template",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="notifications.notificationtemplate",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "notifications",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["user", "status"], name="notificatio_user_id_8ab96f_idx"
                    ),
                    models.Index(
                        fields=["channel", "status"],
                        name="notificatio_channel_411e8e_idx",
                    ),
                    models.Index(
                        fields=["created_at"], name="notificatio_created_e4c995_idx"
                    ),
                ],
            },
        ),
    ]
