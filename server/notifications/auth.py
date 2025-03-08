"""
Authentication middleware for WebSocket connections
"""
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get a user from a token string
    """
    try:
        # Log the token prefix for debugging (first few characters only)
        prefix = token_string[:10] if len(token_string) > 10 else token_string
        logger.debug("Processing token starting with: %s...", prefix)
        
        # Remove any quotes that might have been added
        if token_string.startswith('"') and token_string.endswith('"'):
            token_string = token_string[1:-1]
            logger.debug("Removed quotes from token")
            
        # Validate the token
        token = AccessToken(token_string)
        user_id = token.payload.get('user_id')
        
        if not user_id:
            # Try to find user ID in payload under a different key
            if 'id' in token.payload:
                user_id = token.payload['id']
                logger.debug("Found user_id as 'id' in token payload")
            elif 'user' in token.payload:
                user_id = token.payload['user']
                logger.debug("Found user_id as 'user' in token payload")
            else:
                # Log the payload to help debug
                logger.warning("No user_id found in token payload: %s", token.payload)
                return AnonymousUser()

        # Get the user
        user = User.objects.get(id=user_id)
        logger.info("Successfully authenticated user: %s (ID: %s)", user.username, user_id)
        return user
        
    except TokenError as e:
        logger.warning("Invalid token: %s", str(e))
    except User.DoesNotExist:
        logger.warning("User with id %s not found", user_id)
    except Exception as e:
        # This is a broad exception but reasonable for auth failures
        logger.error("Error authenticating WebSocket user: %s", str(e))
    
    return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom token auth middleware for Django Channels
    """
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        # Extract token from query string
        query_string = scope.get('query_string', b'').decode()
        
        # Handle empty query string
        if not query_string:
            scope['user'] = AnonymousUser()
            logger.warning("Empty query string in WebSocket connection")
            return await self.app(scope, receive, send)
            
        # Parse query parameters
        try:
            query_params = {}
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    query_params[key] = value
            
            logger.debug("WebSocket query params: %s", query_params)
            token = query_params.get('token', None)
        except Exception as e:
            logger.error("Error parsing query string: %s", str(e))
            token = None
        
        if token:
            scope['user'] = await get_user_from_token(token)
            logger.info("WebSocket authenticated user: %s", scope['user'])
        else:
            scope['user'] = AnonymousUser()
            logger.warning("No token provided for WebSocket authentication")
        
        return await self.app(scope, receive, send)

# Auth middleware factory
def TokenAuthMiddlewareStack(app):
    return TokenAuthMiddleware(app)
