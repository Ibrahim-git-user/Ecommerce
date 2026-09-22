from rest_framework import serializers

from .models import Order, OrderItem

class OrderPaymentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['payment_intent_id', 'client_secret']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_name', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ['id', 'total_amount', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')
        order = Order.objects.create(user=request.user.id, **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order