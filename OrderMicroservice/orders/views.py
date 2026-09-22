from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from rest_framework import status, permissions
from rest_framework.views import APIView, Response
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import OrderSerializer, OrderPaymentDetailsSerializer
from .kafka import kafka_producer
from .models import Order

# Create your views here.
class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            kafka_producer.publish_order_created(order_id=order.id, user_id=request.user.id, amount=int(order.total_amount * 100))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderPaymentDetailView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderPaymentDetailsSerializer
    queryset = Order.objects.all()

    def get_object(self):
        obj = get_object_or_404(Order, pk=self.kwargs.get("pk"))

        if str(obj.user) != self.request.user.id:
            raise PermissionDenied("You are not allowed to access this order.")

        return obj