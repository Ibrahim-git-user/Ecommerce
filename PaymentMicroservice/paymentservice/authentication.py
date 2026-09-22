from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class StatelessUser:
    def __init__(self, user_id, roles):
        self.id = user_id
        self.roles = roles
        self.is_authenticated = True

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        SimpleJWT calls this method AFTER it successfully verifies 
        the token's signature and expiration date.
        
        Default behavior: User.objects.get(id=validated_token['user_id'])  <-- DB Call
        Our behavior: Instantiate StatelessUser in memory               <-- No DB Call
        """
        # Extract user claims from the decoded JWT payload
        user_id = validated_token.get('user_id') or validated_token.get('sub')
        
        if not user_id:
            raise InvalidToken("Token contained no recognizable user identification")

        email = validated_token.get('email', '')
        roles = validated_token.get('roles', [])

        # Return the lightweight in-memory user object
        return StatelessUser(
            user_id=user_id,
            email=email,
            roles=roles
        )