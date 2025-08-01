# Generated by Django 4.2.8 on 2025-06-05 20:50

from django.conf import settings
import django.contrib.auth.models
import django.contrib.auth.validators
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
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
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "username",
                    models.CharField(
                        error_messages={
                            "unique": "A user with that username already exists."
                        },
                        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                        max_length=150,
                        unique=True,
                        validators=[
                            django.contrib.auth.validators.UnicodeUsernameValidator()
                        ],
                        verbose_name="username",
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="first name"
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="last name"
                    ),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(
                        default=django.utils.timezone.now, verbose_name="date joined"
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        max_length=254, unique=True, verbose_name="email address"
                    ),
                ),
                (
                    "phone_number",
                    models.CharField(
                        blank=True,
                        help_text="Contact phone number",
                        max_length=17,
                        validators=[
                            django.core.validators.RegexValidator(
                                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
                                regex="^\\+?1?\\d{9,15}$",
                            )
                        ],
                        verbose_name="phone number",
                    ),
                ),
                (
                    "user_type",
                    models.CharField(
                        choices=[
                            ("SEEKER", "Parking Seeker"),
                            ("HOST", "Space Host"),
                            ("BOTH", "Both Seeker and Host"),
                        ],
                        default="SEEKER",
                        help_text="Type of user account",
                        max_length=10,
                        verbose_name="user type",
                    ),
                ),
                (
                    "profile_picture",
                    models.ImageField(
                        blank=True,
                        help_text="Profile picture",
                        null=True,
                        upload_to="profiles/",
                        verbose_name="profile picture",
                    ),
                ),
                (
                    "bio",
                    models.TextField(
                        blank=True,
                        help_text="Short bio about yourself",
                        max_length=500,
                        verbose_name="bio",
                    ),
                ),
                (
                    "date_of_birth",
                    models.DateField(
                        blank=True,
                        help_text="Your date of birth",
                        null=True,
                        verbose_name="date of birth",
                    ),
                ),
                (
                    "is_email_verified",
                    models.BooleanField(
                        default=False,
                        help_text="Whether the email address has been verified",
                        verbose_name="email verified",
                    ),
                ),
                (
                    "is_phone_verified",
                    models.BooleanField(
                        default=False,
                        help_text="Whether the phone number has been verified",
                        verbose_name="phone verified",
                    ),
                ),
                (
                    "is_identity_verified",
                    models.BooleanField(
                        default=False,
                        help_text="Whether identity has been verified",
                        verbose_name="identity verified",
                    ),
                ),
                (
                    "driver_license_number",
                    models.CharField(
                        blank=True,
                        help_text="Driver license number for verification",
                        max_length=50,
                        verbose_name="driver license number",
                    ),
                ),
                (
                    "driver_license_state",
                    models.CharField(
                        blank=True,
                        help_text="State that issued the driver license",
                        max_length=2,
                        verbose_name="driver license state",
                    ),
                ),
                (
                    "default_address",
                    models.CharField(
                        blank=True,
                        help_text="Default address for searches",
                        max_length=255,
                        verbose_name="default address",
                    ),
                ),
                (
                    "stripe_customer_id",
                    models.CharField(
                        blank=True,
                        help_text="Stripe customer ID for payments",
                        max_length=255,
                        verbose_name="Stripe customer ID",
                    ),
                ),
                (
                    "stripe_account_id",
                    models.CharField(
                        blank=True,
                        help_text="Stripe connected account ID for hosts",
                        max_length=255,
                        verbose_name="Stripe account ID",
                    ),
                ),
                (
                    "preferred_notification_method",
                    models.CharField(
                        choices=[
                            ("email", "Email"),
                            ("sms", "SMS"),
                            ("push", "Push Notification"),
                        ],
                        default="email",
                        help_text="Preferred method for notifications",
                        max_length=10,
                        verbose_name="preferred notification method",
                    ),
                ),
                (
                    "average_rating_as_host",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Average rating received as a host",
                        max_digits=3,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(5),
                        ],
                        verbose_name="average rating as host",
                    ),
                ),
                (
                    "total_reviews_as_host",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Total number of reviews received as a host",
                        verbose_name="total reviews as host",
                    ),
                ),
                (
                    "average_rating_as_guest",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Average rating received as a guest",
                        max_digits=3,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(5),
                        ],
                        verbose_name="average rating as guest",
                    ),
                ),
                (
                    "total_reviews_as_guest",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Total number of reviews received as a guest",
                        verbose_name="total reviews as guest",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="updated at"),
                ),
                (
                    "last_login_ip",
                    models.GenericIPAddressField(
                        blank=True,
                        help_text="IP address of last login",
                        null=True,
                        verbose_name="last login IP",
                    ),
                ),
                (
                    "is_deleted",
                    models.BooleanField(default=False, verbose_name="is deleted"),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="deleted at"
                    ),
                ),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "User",
                "verbose_name_plural": "Users",
                "db_table": "users",
            },
            managers=[
                ("objects", django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="UserProfile",
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
                    "emergency_contact_name",
                    models.CharField(
                        blank=True,
                        help_text="Name of emergency contact",
                        max_length=100,
                        verbose_name="emergency contact name",
                    ),
                ),
                (
                    "emergency_contact_phone",
                    models.CharField(
                        blank=True,
                        help_text="Phone number of emergency contact",
                        max_length=17,
                        verbose_name="emergency contact phone",
                    ),
                ),
                (
                    "primary_vehicle_make",
                    models.CharField(
                        blank=True,
                        help_text="Make of primary vehicle",
                        max_length=50,
                        verbose_name="primary vehicle make",
                    ),
                ),
                (
                    "primary_vehicle_model",
                    models.CharField(
                        blank=True,
                        help_text="Model of primary vehicle",
                        max_length=50,
                        verbose_name="primary vehicle model",
                    ),
                ),
                (
                    "primary_vehicle_year",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="Year of primary vehicle",
                        null=True,
                        verbose_name="primary vehicle year",
                    ),
                ),
                (
                    "primary_vehicle_color",
                    models.CharField(
                        blank=True,
                        help_text="Color of primary vehicle",
                        max_length=30,
                        verbose_name="primary vehicle color",
                    ),
                ),
                (
                    "primary_vehicle_license_plate",
                    models.CharField(
                        blank=True,
                        help_text="License plate of primary vehicle",
                        max_length=20,
                        verbose_name="primary vehicle license plate",
                    ),
                ),
                (
                    "auto_approve_bookings",
                    models.BooleanField(
                        default=False,
                        help_text="Automatically approve booking requests for your listings",
                        verbose_name="auto approve bookings",
                    ),
                ),
                (
                    "email_notifications",
                    models.BooleanField(
                        default=True,
                        help_text="Receive email notifications",
                        verbose_name="email notifications",
                    ),
                ),
                (
                    "sms_notifications",
                    models.BooleanField(
                        default=False,
                        help_text="Receive SMS notifications",
                        verbose_name="SMS notifications",
                    ),
                ),
                (
                    "push_notifications",
                    models.BooleanField(
                        default=True,
                        help_text="Receive push notifications",
                        verbose_name="push notifications",
                    ),
                ),
                (
                    "show_phone_to_guests",
                    models.BooleanField(
                        default=False,
                        help_text="Show phone number to confirmed guests",
                        verbose_name="show phone to guests",
                    ),
                ),
                (
                    "show_last_name",
                    models.BooleanField(
                        default=True,
                        help_text="Show last name in profile",
                        verbose_name="show last name",
                    ),
                ),
                (
                    "marketing_emails",
                    models.BooleanField(
                        default=True,
                        help_text="Receive marketing and promotional emails",
                        verbose_name="marketing emails",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="updated at"),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User Profile",
                "verbose_name_plural": "User Profiles",
                "db_table": "user_profiles",
            },
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["email"], name="users_email_4b85f2_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["phone_number"], name="users_phone_n_a3b1c5_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["user_type"], name="users_user_ty_578f8f_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["stripe_customer_id"], name="users_stripe__0fdd23_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["is_email_verified"], name="users_is_emai_476443_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["is_identity_verified"], name="users_is_iden_2555c3_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["created_at"], name="users_created_6541e9_idx"),
        ),
    ]
