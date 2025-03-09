from rest_framework import serializers
from .models import User
import re


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "role",
            "photo",
            "status",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "photo": {"required": False},
            "status": {"required": False},
        }
        read_only_fields = ["id", "date_joined", "is_active"]

    # first name must be letters only, between 1 and 255 characters
    def validate_first_name(self, value):
        if not value:
            raise serializers.ValidationError("First name is required.")
        if len(value) > 255:
            raise serializers.ValidationError(
                "First name should not exceed 255 characters."
            )
        if not re.match(r"^[a-zA-Z]+$", value):
            raise serializers.ValidationError("First name should contain only letters.")
        return value

    # last name must be letters only, between 1 and 255 characters
    def validate_last_name(self, value):
        if not value:
            raise serializers.ValidationError("Last name is required.")
        if len(value) > 255:
            raise serializers.ValidationError(
                "Last name should not exceed 255 characters."
            )
        if not re.match(r"^[a-zA-Z]+$", value):
            raise serializers.ValidationError("Last name should contain only letters.")
        return value

    # username must be letters, numbers, and _, between 6 and 255 characters
    def validate_username(self, value):
        if len(value) < 6:
            raise serializers.ValidationError(
                "Username must have at least 6 characters."
            )
        if len(value) > 255:
            raise serializers.ValidationError(
                "Username should not exceed 255 characters."
            )
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and _."
            )
        return value

    # password must be letters, numbers, and special characters, between 8 and 255 characters
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must have at least 8 characters."
            )
        if len(value) > 255:
            raise serializers.ValidationError(
                "Password should not exceed 255 characters."
            )

        # Check if password contains at least 2 of: letters, numbers, special characters
        has_letter = bool(re.search(r"[a-zA-Z]", value))
        has_number = bool(re.search(r"[0-9]", value))
        has_special = bool(re.search(r"[^a-zA-Z0-9]", value))

        criteria_met = [has_letter, has_number, has_special].count(True)
        if criteria_met < 2:
            raise serializers.ValidationError(
                "Password must contain at least 2 of: letters, numbers, and special characters."
            )
        return value

    # use password hasher
    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user
