from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        validated_data['is_superuser'] = validated_data.get('role') == 3  # Set is_superuser based on role
        validated_data['is_staff'] = (validated_data.get('role') == 0)  or validated_data['is_superuser']
        member = Member.objects.create_user(**validated_data)
        return member
