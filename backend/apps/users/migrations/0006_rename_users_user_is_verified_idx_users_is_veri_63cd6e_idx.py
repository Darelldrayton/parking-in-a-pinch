# Generated by Django 4.2.8 on 2025-07-25 13:04

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0005_merge_20250719_1512"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="user",
            new_name="users_is_veri_63cd6e_idx",
            old_name="users_user_is_verified_idx",
        ),
    ]
