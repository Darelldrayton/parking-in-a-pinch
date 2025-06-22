# Generated manually for parking type updates

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0005_add_admin_approval_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="parkinglisting",
            name="space_type",
            field=models.CharField(
                choices=[
                    ("garage", "Garage"),
                    ("street", "Street parking"),
                    ("lot", "Parking lot"),
                    ("covered", "Covered space"),
                    ("driveway", "Driveway"),
                ],
                help_text="Type of parking space",
                max_length=20,
                verbose_name="space type",
            ),
        ),
    ]