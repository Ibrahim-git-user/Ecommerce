from rest_framework_simplejwt import views as jwt_views
from django.urls import path

from user.views import SignupView 


urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', jwt_views.TokenObtainPairView.as_view(), name='login_token'),
    path('refresh_token/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
]