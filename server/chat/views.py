# class ChatMessageViewSet(viewsets.ModelViewSet):
#     serializer_class = ChatMessageSerializer

#     def get_queryset(self):
#         user = self.request.user
#         # Users can only see messages they've sent or received
#         return ChatMessage.objects.filter(sender=user) | ChatMessage.objects.filter(
#             receiver=user
#         )

#     def get_permissions(self):
#         if self.action == "create":
#             permission_classes = [IsAuthenticated]
#         elif self.action in ["update", "partial_update", "destroy"]:
#             # Only message senders can modify their messages
#             permission_classes = [IsOwner]
#         elif self.action in ["list", "retrieve"]:
#             # Users can only view messages they're involved in
#             permission_classes = [IsOwner]
#         else:
#             permission_classes = [IsAuthenticated]
#         return [permission() for permission in permission_classes]

#     def perform_create(self, serializer):
#         serializer.save(sender=self.request.user)
