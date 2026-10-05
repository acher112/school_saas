"""
Serializers for School tenancy, campus management, and self-service onboarding.
"""
from rest_framework import serializers
from django.db import transaction
from apps.core.models import School, Campus, Domain, SchoolAnnouncement
from apps.authentication.models import User, UserRole
from rest_framework_simplejwt.tokens import RefreshToken

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = ['id', 'name', 'code', 'address', 'is_main', 'created_at']
        read_only_fields = ['id', 'created_at']

class SchoolSerializer(serializers.ModelSerializer):
    campuses = CampusSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'slug', 'contact_email', 'contact_phone',
            'address', 'city', 'country', 'currency', 'timezone',
            'logo', 'brand_primary_color', 'brand_accent_color',
            'is_active', 'campuses', 'created_at'
        ]
        read_only_fields = ['id', 'is_active', 'created_at']

class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolAnnouncement
        fields = ['id', 'school_id', 'campus_id', 'title', 'content', 'is_published', 'created_at']
        read_only_fields = ['id', 'school_id', 'created_at']

class SchoolSignupSerializer(serializers.Serializer):
    """
    Handles atomic, self-service onboarding for a new school.
    Creates the School, default Main Campus, Subdomain, and Admin User in a single transaction.
    """
    # School details
    school_name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=100)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=32)
    city = serializers.CharField(max_length=100, default="Lahore")
    brand_primary_color = serializers.CharField(max_length=7, default="#2563EB")
    brand_accent_color = serializers.CharField(max_length=7, default="#F59E0B")

    # Initial Administrator credentials
    admin_username = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(min_length=8, write_only=True)
    admin_first_name = serializers.CharField(max_length=150, required=False, default="")
    admin_last_name = serializers.CharField(max_length=150, required=False, default="")

    def validate_slug(self, value):
        slug = value.strip().lower()
        if slug in ('admin', 'api', 'www', 'app', 'portal', 'dashboard', 'root'):
            raise serializers.ValidationError("This subdomain slug is reserved for system operations.")
        if School.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("A school with this subdomain already exists.")
        return slug

    def validate_admin_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            # 1. Create School Tenant
            school = School.objects.create(
                name=validated_data['school_name'],
                slug=validated_data['slug'],
                contact_email=validated_data['contact_email'],
                contact_phone=validated_data['contact_phone'],
                city=validated_data.get('city', 'Lahore'),
                brand_primary_color=validated_data.get('brand_primary_color', '#2563EB'),
                brand_accent_color=validated_data.get('brand_accent_color', '#F59E0B'),
                is_active=True
            )

            # 2. Create Default Main Campus
            campus = Campus.objects.create(
                school=school,
                name="Main Campus",
                code="MAIN",
                address=validated_data.get('city', 'Lahore'),
                is_main=True
            )

            # 3. Create Default Subdomain
            Domain.objects.create(
                school=school,
                domain=f"{school.slug}.myschoolsaas.com",
                is_primary=True
            )

            # 4. Create Tenant School Admin User
            admin_user = User.objects.create_user(
                username=validated_data['admin_username'],
                email=validated_data['admin_email'],
                password=validated_data['admin_password'],
                first_name=validated_data.get('admin_first_name', ''),
                last_name=validated_data.get('admin_last_name', ''),
                school=school,
                role=UserRole.SCHOOL_ADMIN,
                preferred_language='en'
            )

            # 5. Issue immediate JWT tokens for instant authentication
            refresh = RefreshToken.for_user(admin_user)
            refresh['school_id'] = str(school.id)
            refresh['school_slug'] = school.slug
            refresh['role'] = admin_user.role

            return {
                'school': SchoolSerializer(school).data,
                'admin_user': {
                    'id': str(admin_user.id),
                    'username': admin_user.username,
                    'email': admin_user.email,
                    'role': admin_user.role
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
