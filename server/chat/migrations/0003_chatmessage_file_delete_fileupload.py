# Generated by Django 5.1.3 on 2025-03-09 11:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0002_remove_chatmessage_message_type_chatmessage_is_read"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="file",
            field=models.FileField(blank=True, null=True, upload_to="chat_files/"),
        ),
        migrations.DeleteModel(
            name="FileUpload",
        ),
    ]
