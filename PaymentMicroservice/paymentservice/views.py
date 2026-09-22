# Create your views here.
# views.py
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import stripe

from rest_framework import status, permissions
from rest_framework.views import APIView, Response
from django.conf import settings

from paymentservice.models import Transaction
from paymentservice.kafka import kafka_producer


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            self._process_successful_payment(intent['id'])

        return Response({"status": "success"}, status=status.HTTP_200_OK)

    def _process_successful_payment(self, provider_tx_id):
        with transaction.atomic():
            # Atomic lock to prevent race conditions from duplicate webhooks
            tx = Transaction.objects.select_for_update().filter(
                provider_transaction_id=provider_tx_id
            ).first()

            if not tx or tx.status == Transaction.Status.SUCCESS:
                return  # Already processed (Idempotent guard)

            tx.status = Transaction.Status.SUCCESS
            tx.save()

            # Publish event to Message Broker (e.g., Celery/Kafka task)
            kafka_producer.publish_PaymentSuccess(order_id = tx.order_id)