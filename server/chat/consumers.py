import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import ChatMessage
from asgiref.sync import sync_to_async
from .services import notify_new_message
from django.db.models import Q

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.group_name = None

    async def connect(self):
        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()
        token = None
        if query_string:
            try:
                params = dict(
                    item.split("=") for item in query_string.split("&") if "=" in item
                )
                token = params.get("token")
            except Exception as e:
                logger.error(f"Error parsing query string: {str(e)}")

        if not token:
            await self.close()
            return

        try:
            # Validate token and get user
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            self.user = await self.get_user(user_id)

            # Join user's chat group
            self.group_name = f"user_{user_id}_chat"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

        except (TokenError, User.DoesNotExist) as e:
            logger.error(f"Authentication failed: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    async def receive(self, text_data):
        if not self.user:
            return

        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "chat_message":
                await self.handle_chat_message(data)
            elif message_type == "mark_read":
                await self.handle_mark_read(data)
            elif message_type == "get_chat_history":
                await self.handle_get_chat_history(data)
            elif message_type == "get_chat_sessions":
                await self.handle_get_chat_sessions()
            elif message_type == "send_message":
                await self.handle_send_message(data)
            elif message_type == "initialize_chat":
                await self.handle_initialize_chat(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to process your request"}
                )
            )

    async def handle_chat_message(self, data):
        try:
            receiver_id = data.get("receiver_id")
            content = data.get("content", "")
            file = data.get("file")
            message_id = data.get("message_id")

            if not receiver_id:
                return

            # If we have a message_id, use that directly instead of saving a new message
            if message_id:
                # Construct message from provided data
                message = {
                    "id": message_id,
                    "sender_id": self.user.id,
                    "sender_name": self.user.get_full_name() or self.user.username,
                    "receiver_id": int(receiver_id),
                    "content": content,
                    "timestamp": timezone.now().isoformat(),
                    "file": file,
                    "isSender": True,
                }
            else:
                # Save and send message (legacy path)
                message = await self.save_message(receiver_id, content)
            if message:
                # Send to receiver's group
                # For the receiver, set isSender to False
                receiver_message = message.copy()
                receiver_message["isSender"] = False

                await self.channel_layer.group_send(
                    f"user_{receiver_id}_chat",
                    {"type": "chat_message", "message": receiver_message},
                )

                # Send notification with message content/file info
                await self.notify_receiver(message["receiver_id"], message)

                # Confirm to sender
                await self.send(
                    text_data=json.dumps({"type": "message_sent", "message": message})
                )

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to send message"}
                )
            )

    async def handle_mark_read(self, data):
        """Handle marking messages as read for a specific chat"""
        try:
            chat_id = data.get("chat_id")
            if not chat_id:
                return

            # Mark messages as read and check if any unread messages remain
            has_unread, any_unread_sessions = await self.mark_messages_read(chat_id)

            # Send update to the user about read status
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "read_status_update",
                        "chat_id": chat_id,
                        "has_unread": has_unread,
                        "all_read": not any_unread_sessions,
                        "any_unread_sessions": any_unread_sessions,
                    }
                )
            )

        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to mark messages as read"}
                )
            )

    async def handle_get_chat_history(self, data):
        """Handle request for chat history with a specific user"""
        try:
            chat_id = data.get("chat_id")
            if not chat_id:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Missing chat_id parameter"}
                    )
                )
                return

            # Get chat history and mark messages as read
            messages, has_unread, any_unread_sessions = await self.get_chat_history(
                chat_id
            )

            # Send chat history to the requester
            await self.send(
                text_data=json.dumps({"type": "chat_history", "messages": messages})
            )

            # Send read status update
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "read_status_update",
                        "chat_id": chat_id,
                        "has_unread": has_unread,
                        "all_read": not any_unread_sessions,
                        "any_unread_sessions": any_unread_sessions,
                    }
                )
            )

        except Exception as e:
            logger.error(f"Error fetching chat history: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to fetch chat history"}
                )
            )

    async def handle_get_chat_sessions(self):
        """Handle request for all chat sessions"""
        try:
            sessions = await self.get_chat_sessions()

            await self.send(
                text_data=json.dumps({"type": "chat_sessions", "sessions": sessions})
            )

        except Exception as e:
            logger.error(f"Error fetching chat sessions: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to fetch chat sessions"}
                )
            )

    async def handle_send_message(self, data):
        """Handle sending a new message via WebSocket"""
        try:
            receiver_id = data.get("receiver_id")
            content = data.get("content", "")
            temp_id = data.get("temp_id")

            if not receiver_id:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Missing receiver_id parameter"}
                    )
                )
                return

            # Save message to database
            message = await self.save_message(receiver_id, content)

            if message:
                # Add temp_id to link with client-side temporary message
                if temp_id:
                    message["temp_id"] = temp_id

                # Send to receiver's group
                receiver_message = message.copy()
                receiver_message["isSender"] = False

                await self.channel_layer.group_send(
                    f"user_{receiver_id}_chat",
                    {"type": "chat_message", "message": receiver_message},
                )

                # Send notification to receiver
                await self.notify_receiver(message["receiver_id"], message)

                # Confirm to sender
                await self.send(
                    text_data=json.dumps({"type": "message_sent", "message": message})
                )
            else:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Failed to send message"}
                    )
                )

        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to send message"}
                )
            )

    async def handle_initialize_chat(self, data):
        """Handle initializing a new chat with a user who hasn't been messaged before"""
        try:
            chat_id = data.get("chat_id")
            if not chat_id:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Missing chat_id parameter"}
                    )
                )
                return

            # Get user information for the new chat partner
            user_info = await self.get_user_info(chat_id)

            if not user_info:
                await self.send(
                    text_data=json.dumps({"type": "error", "message": "User not found"})
                )
                return

            # Send empty chat history
            await self.send(
                text_data=json.dumps({"type": "chat_history", "messages": []})
            )

            # Update chat sessions to include this new user
            sessions = await self.get_chat_sessions()

            # Check if this user is already in the sessions
            user_exists = any(session["id"] == chat_id for session in sessions)

            if not user_exists:
                # Add the new user to the sessions list
                new_session = {
                    "id": user_info["id"],
                    "name": user_info["name"],
                    "last_message": "",
                    "is_unread": False,
                }

                # Send updated sessions including the new user
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "chat_sessions",
                            "sessions": [new_session] + sessions,
                        }
                    )
                )

        except Exception as e:
            logger.error(f"Error initializing chat: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Failed to initialize chat"}
                )
            )

    @sync_to_async
    def mark_messages_read(self, chat_id):
        """Mark all messages from a specific sender as read"""
        try:
            # Get the other user (chat partner)
            other_user = User.objects.get(id=chat_id)

            # Mark all unread messages from this user as read
            ChatMessage.objects.filter(
                sender=other_user, receiver=self.user, is_read=False
            ).update(is_read=True)

            # Check if there are still unread messages from this chat partner
            has_unread = ChatMessage.objects.filter(
                sender=other_user, receiver=self.user, is_read=False
            ).exists()

            # Check if there are any unread messages from any chat partner
            any_unread_sessions = ChatMessage.objects.filter(
                receiver=self.user, is_read=False
            ).exists()

            return has_unread, any_unread_sessions

        except User.DoesNotExist:
            logger.error(f"User {chat_id} not found")
            return False, False

    @sync_to_async
    def get_chat_history(self, chat_id):
        """Get chat history with a specific user and mark messages as read"""
        try:
            # Get the other user (chat partner)
            other_user = User.objects.get(id=chat_id)
            current_user = self.user

            # Get all messages between the two users
            messages_query = ChatMessage.objects.filter(
                (Q(sender=current_user) & Q(receiver=other_user))
                | (Q(sender=other_user) & Q(receiver=current_user))
            ).order_by("timestamp")

            # Mark all messages as read
            unread_messages = messages_query.filter(
                sender=other_user, receiver=current_user, is_read=False
            )
            unread_messages.update(is_read=True)

            # Convert messages to serializable format
            messages = []
            for msg in messages_query:
                # Determine if the current user is the sender
                is_sender = msg.sender.id == current_user.id

                # Prepare file data if a file is attached
                file_data = None
                if msg.file and msg.file.name:
                    file_data = {
                        "id": msg.id,
                        "type": (
                            msg.file.name.split(".")[-1].lower()
                            if "." in msg.file.name
                            else None
                        ),
                        "title": msg.file.name.split("/")[-1],
                        "url": msg.file.url,
                    }

                messages.append(
                    {
                        "id": msg.id,
                        "content": msg.content,
                        "isSender": is_sender,
                        "timestamp": msg.timestamp.isoformat(),
                        "file": file_data,
                    }
                )

            # Check if there are still unread messages from this chat partner
            has_unread = ChatMessage.objects.filter(
                sender=other_user, receiver=current_user, is_read=False
            ).exists()

            # Check if there are any unread messages from any chat partner
            any_unread_sessions = ChatMessage.objects.filter(
                receiver=current_user, is_read=False
            ).exists()

            return messages, has_unread, any_unread_sessions

        except User.DoesNotExist:
            logger.error(f"User {chat_id} not found")
            return [], False, False

    @sync_to_async
    def get_chat_sessions(self):
        """Get all chat sessions for the current user"""
        user = self.user

        # Get all users who have chatted with the current user
        chat_partners = User.objects.filter(
            Q(messages_sent__receiver=user) | Q(messages_received__sender=user)
        ).distinct()

        # For each chat partner, get their latest message and unread status
        chat_sessions = []
        for partner in chat_partners:
            latest_message = (
                ChatMessage.objects.filter(
                    (Q(sender=user) & Q(receiver=partner))
                    | (Q(sender=partner) & Q(receiver=user))
                )
                .order_by("-timestamp")
                .first()
            )

            # Check if there are any unread messages from this partner
            has_unread = ChatMessage.objects.filter(
                sender=partner, receiver=user, is_read=False
            ).exists()

            chat_sessions.append(
                {
                    "id": partner.id,
                    "name": partner.get_full_name() or partner.username,
                    "last_message": (
                        latest_message.content or "Sent a file"
                        if latest_message
                        else ""
                    ),
                    "is_unread": has_unread,
                }
            )

        return chat_sessions

    @sync_to_async
    def save_message(self, receiver_id, content):
        try:
            receiver = User.objects.get(id=receiver_id)
            message = ChatMessage.objects.create(
                sender=self.user, receiver=receiver, content=content
            )

            # Create a chat_id using user ids to match API format
            # This should be the same logic used by the API to determine chat ID
            chat_id = receiver_id  # Assuming chat_id is the other user's ID

            # Prepare file data if a file is attached to the message
            file_data = None
            if message.file and message.file.name:
                # Create a structure that matches the ChatFileSerializer output
                file_data = {
                    "id": message.id,  # Using message id since file doesn't have its own id
                    "type": (
                        message.file.name.split(".")[-1].lower()
                        if "." in message.file.name
                        else None
                    ),
                    "title": message.file.name.split("/")[-1],
                    "url": message.file.url,
                }

            return {
                "id": message.id,
                "sender_id": self.user.id,
                "sender_name": self.user.get_full_name() or self.user.username,
                "receiver_id": receiver.id,
                "chat_id": chat_id,  # Add chat_id field
                "isSender": True,  # Add isSender field for sender
                "content": content,
                "timestamp": message.timestamp.isoformat(),
                "file": file_data,  # Include actual file data if available
            }
        except User.DoesNotExist:
            logger.error(f"Receiver {receiver_id} not found")
            return None

    @sync_to_async
    def notify_receiver(self, receiver_id, message_data):
        try:
            receiver = User.objects.get(id=receiver_id)
            # Extract message content or file name
            content = message_data.get("content", "")
            file_data = message_data.get("file")

            # If there's a file but no content, use the file title as notification content
            if not content and file_data and "title" in file_data:
                content = f"Sent a file: {file_data['title']}"
            elif not content:
                content = "Sent a file"

            notify_new_message(self.user, receiver, content)
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")

    @sync_to_async
    def get_user_info(self, user_id):
        """Get basic information about a user"""
        try:
            user = User.objects.get(id=user_id)
            return {
                "id": user.id,
                "name": user.get_full_name() or user.username,
            }
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found")
            return None

    async def chat_message(self, event):
        """Handle chat message event from channel layer"""
        await self.send(text_data=json.dumps(event))

    async def notification_message(self, event):
        """Handle notification message event from channel layer"""
        await self.send(text_data=json.dumps(event))
