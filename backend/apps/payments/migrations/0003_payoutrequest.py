# Generated migration for PayoutRequest model
from decimal import Decimal
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("payments", "0002_refundrequest"),
    ]

    operations = [
        migrations.CreateModel(
            name="PayoutRequest",
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
                    "request_id",
                    models.CharField(
                        db_index=True,
                        help_text="Internal request identifier",
                        max_length=20,
                        unique=True,
                        verbose_name="request ID",
                    ),
                ),
                (
                    "requested_amount",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Requested payout amount",
                        max_digits=10,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                        verbose_name="requested amount",
                    ),
                ),
                (
                    "approved_amount",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Admin approved payout amount",
                        max_digits=10,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                        verbose_name="approved amount",
                    ),
                ),
                (
                    "payout_method",
                    models.CharField(
                        choices=[
                            ("bank_transfer", "Bank Transfer"),
                            ("stripe_express", "Stripe Express"),
                            ("paypal", "PayPal"),
                            ("check", "Check"),
                            ("other", "Other"),
                        ],
                        default="bank_transfer",
                        help_text="Method for payout delivery",
                        max_length=20,
                        verbose_name="payout method",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending Review"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("completed", "Completed"),
                        ],
                        default="pending",
                        help_text="Current request status",
                        max_length=20,
                        verbose_name="status",
                    ),
                ),
                (
                    "bank_name",
                    models.CharField(
                        blank=True,
                        help_text="Name of the bank",
                        max_length=100,
                        verbose_name="bank name",
                    ),
                ),
                (
                    "account_holder_name",
                    models.CharField(
                        blank=True,
                        help_text="Name on the bank account",
                        max_length=100,
                        verbose_name="account holder name",
                    ),
                ),
                (
                    "account_number",
                    models.CharField(
                        blank=True,
                        help_text="Bank account number (encrypted)",
                        max_length=255,
                        verbose_name="account number",
                    ),
                ),
                (
                    "routing_number",
                    models.CharField(
                        blank=True,
                        help_text="Bank routing number",
                        max_length=20,
                        verbose_name="routing number",
                    ),
                ),
                (
                    "host_notes",
                    models.TextField(
                        blank=True,
                        help_text="Notes from the host requesting payout",
                        verbose_name="host notes",
                    ),
                ),
                (
                    "admin_notes",
                    models.TextField(
                        blank=True,
                        help_text="Internal admin notes",
                        verbose_name="admin notes",
                    ),
                ),
                (
                    "rejection_reason",
                    models.TextField(
                        blank=True,
                        help_text="Reason for rejection if denied",
                        verbose_name="rejection reason",
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
                    "reviewed_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When the request was reviewed",
                        null=True,
                        verbose_name="reviewed at",
                    ),
                ),
                (
                    "processed_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When the payout was processed",
                        null=True,
                        verbose_name="processed at",
                    ),
                ),
                (
                    "host",
                    models.ForeignKey(
                        help_text="Host requesting the payout",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payout_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "payout",
                    models.OneToOneField(
                        blank=True,
                        help_text="Associated payout after processing",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payout_request",
                        to="payments.payout",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        help_text="Admin who reviewed the request",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_payouts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Payout Request",
                "verbose_name_plural": "Payout Requests",
                "db_table": "payout_requests",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["status", "created_at"],
                        name="payout_requ_status_a1b2c3_idx",
                    ),
                    models.Index(
                        fields=["host"], name="payout_requ_host_d4e5f6_idx"
                    ),
                    models.Index(
                        fields=["reviewed_by"], name="payout_requ_review_g7h8i9_idx"
                    ),
                ],
            },
        ),
        # Create the many-to-many relationship table for payments
        migrations.CreateModel(
            name="PayoutRequestPayments",
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
                    "payoutrequest",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="payments.payoutrequest",
                    ),
                ),
                (
                    "payment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="payments.payment",
                    ),
                ),
            ],
            options={
                "db_table": "payout_request_payments",
            },
        ),
        # Add the many-to-many field
        migrations.AddField(
            model_name="payoutrequest",
            name="payments",
            field=models.ManyToManyField(
                blank=True,
                help_text="Payments included in this payout request",
                related_name="payout_requests",
                through="payments.PayoutRequestPayments",
                to="payments.payment",
            ),
        ),
    ]