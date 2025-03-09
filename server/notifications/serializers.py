"""
Notification Serializers
=======================

This module contains serializers for the Notification model,
handling the conversion between Notification instances and JSON data.
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for the Notification model.

    Converts Notification instances to JSON and vice versa,
    while controlling which fields are exposed in the API.
    """

    # Display the recipient's username instead of ID
    recipient = serializers.StringRelatedField()

    class Meta:
        """
        Meta class defining serializer configuration.

        Attributes:
            model: The model being serialized
            fields: The fields to include in the serialized output
            read_only_fields: Fields that cannot be modified through the API
        """

        model = Notification
        fields = [
            "id",
            "recipient",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
