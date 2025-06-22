import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if not token:
            logger.warning("WebSocket connection rejected: No token provided")
            await self.close()
            return
            
        # Authenticate user
        self.user = await self.get_user_from_token(token)
        if self.user is None or isinstance(self.user, AnonymousUser):
            logger.warning(f"WebSocket connection rejected: Invalid token")
            await self.close()
            return
            
        # Add user to their personal notification group
        self.group_name = f"notifications_user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected for user {self.user.id}")
        
        # Send connection status
        await self.send(text_data=json.dumps({
            'type': 'connection_status',
            'status': 'connected',
            'message': 'Real-time notifications enabled'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        if hasattr(self, 'user'):
            logger.info(f"WebSocket disconnected for user {self.user.id}")

    async def receive(self, text_data):
        # Handle incoming WebSocket messages (if needed)
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket")

    # Handle notification from group
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps(event['notification']))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Validate the token
            UntypedToken(token)
            
            # Decode the token to get user_id
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get the user
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.error(f"Token validation failed: {e}")
            return None