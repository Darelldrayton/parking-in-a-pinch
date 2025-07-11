# Generated manually for PayoutRequest payout method choices update

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_payoutrequest'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payoutrequest',
            name='payout_method',
            field=models.CharField(
                choices=[
                    ('bank_transfer', 'Bank Transfer (ACH)'), 
                    ('wire_transfer', 'Wire Transfer'), 
                    ('check', 'Paper Check'), 
                    ('paypal', 'PayPal'), 
                    ('zelle', 'Zelle'), 
                    ('venmo', 'Venmo'), 
                    ('cashapp', 'Cash App')
                ],
                default='bank_transfer',
                help_text='Preferred payout method',
                max_length=20,
                verbose_name='payout method'
            ),
        ),
    ]