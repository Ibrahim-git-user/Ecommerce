import enum

from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class MemberRole(enum.Enum):
    STAFF = 0
    CUSTOMER = 1
    SELLER = 2
    SUPERUSER = 3

class Member(AbstractUser):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, blank=False, null=False)
    phone_number = models.CharField(max_length=15, unique=True, blank=False, null=False)
    role = models.IntegerField(
        choices=[
            (role.value, role.name.title())
            for role in MemberRole
        ],
    )

    # password, last_login, is_superuser, username, first_name, last_name, is_staff, is_active, 
    # date_joined, uuid, email, phone_number, role
    # REQUIRED_FIELDS = ['phone_number', 'email', 'role']

    class Meta:
        verbose_name = "Member"
        verbose_name_plural = "Members"
        db_table = "member"

    def __str__(self):
        return self.get_full_name() or self.email
    
