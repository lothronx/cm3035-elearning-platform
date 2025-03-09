from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.http import Http404

from .models import ChatMessage, FileUpload
from .serializers import ChatMessageSerializer, FileUploadSerializer

User = get_user_model()


class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling chat messages
    Provides endpoints for fetching message history, contacts list, and sending messages
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        """
        Return messages where the current user is either sender or receiver,
        ordered by timestamp (most recent first)
        """
        user = self.request.user
        return ChatMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-timestamp')

    def perform_create(self, serializer):
        """
        Set sender to current user when creating a new message
        """
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'], url_path='contacts')
    def get_contacts(self, request):
        """
        GET: Retrieve a list of users the current user has chatted with
        Returns id, name, lastMessage, and unreadCount for each contact
        """
        user = request.user
        # Find all users who have sent messages to or received messages from the current user
        sent_to_ids = ChatMessage.objects.filter(sender=user).values_list('receiver', flat=True).distinct()
        received_from_ids = ChatMessage.objects.filter(receiver=user).values_list('sender', flat=True).distinct()
        
        # Combine and remove duplicates
        contact_ids = set(list(sent_to_ids) + list(received_from_ids))
        contacts = User.objects.filter(id__in=contact_ids)
        
        # Format the response
        contacts_data = []
        for contact in contacts:
            # Get the last message between current user and this contact
            last_message = ChatMessage.objects.filter(
                (Q(sender=user) & Q(receiver=contact)) |
                (Q(sender=contact) & Q(receiver=user))
            ).order_by('-timestamp').first()
            
            # Count unread messages from this contact
            unread_count = ChatMessage.objects.filter(
                sender=contact,
                receiver=user,
                is_read=False
            ).count()
            
            # Prepare contact data
            contact_data = {
                'id': str(contact.id),  # Convert to string to match the client interface
                'name': f"{contact.first_name} {contact.last_name}".strip() or contact.username,
                'lastMessage': last_message.content if last_message else "",
                'unreadCount': unread_count
            }
            contacts_data.append(contact_data)
        
        return Response(contacts_data)

    @action(detail=False, methods=['get'], url_path='history/(?P<user_id>[^/.]+)')
    def get_chat_history(self, request, user_id=None):
        """
        GET: Retrieve chat history between current user and specified user
        """
        try:
            # Check if other user exists
            other_user = User.objects.get(id=user_id)
            
            # Get messages between these two users
            current_user = request.user
            messages = ChatMessage.objects.filter(
                (Q(sender=current_user) & Q(receiver=other_user)) |
                (Q(sender=other_user) & Q(receiver=current_user))
            ).order_by('timestamp')  # Chronological order
            
            # Mark messages from the other user as read
            unread_messages = messages.filter(sender=other_user, receiver=current_user, is_read=False)
            for message in unread_messages:
                message.is_read = True
                message.save()
            
            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)
        
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='mark-read/(?P<user_id>[^/.]+)')
    def mark_messages_read(self, request, user_id=None):
        """
        POST: Mark all messages from specified user to current user as read
        """
        try:
            # Check if other user exists
            other_user = User.objects.get(id=user_id)
            current_user = request.user
            
            # Find unread messages from this user
            unread_messages = ChatMessage.objects.filter(
                sender=other_user,
                receiver=current_user,
                is_read=False
            )
            
            # Mark all as read
            count = unread_messages.count()
            unread_messages.update(is_read=True)
            
            return Response({
                'success': True,
                'messages_marked_read': count
            })
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='send')
    def send_message(self, request):
        """
        POST: Send a new message to another user
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Check if receiver exists
                receiver_id = request.data.get('receiver')
                receiver = User.objects.get(id=receiver_id)
                
                # Create message
                message = serializer.save(sender=request.user, receiver=receiver)
                
                # Handle file uploads if message_type is 'file'
                if message.message_type == 'file' and 'file' in request.FILES:
                    file_serializer = FileUploadSerializer(data={
                        'chat_message': message.id,
                        'file': request.FILES['file']
                    })
                    
                    if file_serializer.is_valid():
                        file_serializer.save()
                    else:
                        # If file upload fails, delete the message and return error
                        message.delete()
                        return Response(
                            file_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Serialize with request context to get proper URLs
                response_serializer = self.get_serializer(message, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
            except User.DoesNotExist:
                return Response(
                    {"error": "Receiver not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FileUploadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling file uploads related to chat messages
    """
    queryset = FileUpload.objects.all()
    serializer_class = FileUploadSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']
    
    def get_queryset(self):
        """
        Only return files attached to messages where the user is either sender or receiver
        """
        user = self.request.user
        return FileUpload.objects.filter(
            Q(chat_message__sender=user) | Q(chat_message__receiver=user)
        )
    
    def perform_create(self, serializer):
        """
        Validate that the user is allowed to attach files to this message
        """
        message_id = self.request.data.get('chat_message')
        try:
            message = ChatMessage.objects.get(id=message_id)
            # Only allow if user is the sender of the message
            if message.sender != self.request.user:
                raise Http404("Not authorized to attach files to this message")
            serializer.save()
        except ChatMessage.DoesNotExist:
            raise Http404("Chat message not found")
