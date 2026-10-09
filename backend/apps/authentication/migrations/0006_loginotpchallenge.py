# Generated manually for LoginOTPChallenge model
import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_apply_parentstudentrelation_rls'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginOTPChallenge',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(help_text='Registered email address to which code was dispatched.', max_length=254)),
                ('session_id', models.UUIDField(db_index=True, default=uuid.uuid4, unique=True)),
                ('code_hash', models.CharField(max_length=255)),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('expires_at', models.DateTimeField()),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_sent_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='login_otp_challenges', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Login OTP Challenge',
                'verbose_name_plural': 'Login OTP Challenges',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['session_id'], name='auth_otp_session_idx'),
                    models.Index(fields=['user', 'is_verified'], name='auth_otp_user_ver_idx'),
                ],
            },
        ),
    ]
