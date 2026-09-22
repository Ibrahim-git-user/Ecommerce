# payments/management/commands/consume_order_events.py
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from confluent_kafka import Consumer, KafkaError
from paymentservice.models import Transaction
from paymentservice.providers import StripePaymentProvider
from paymentservice.kafka import kafka_producer

class Command(BaseCommand):
    help = "Runs background consumer for order events from Kafka"

    def handle(self, *args, **options):
        consumer = Consumer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'payment-service-group',  # Consumer group ID
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False            # Manual commit for financial safety
        })

        consumer.subscribe(['orders'])
        self.stdout.write(self.style.SUCCESS("Listening for order.created events..."))

        try:
            while True:
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() != KafkaError._PARTITION_EOF:
                        self.stderr.write(f"Consumer error: {msg.error()}")
                    continue

                # Process message
                payload = json.loads(msg.value().decode('utf-8'))
                self._process_order_event(payload)

                # Commit offset after successful database write
                consumer.commit(msg)

        except KeyboardInterrupt:
            pass
        finally:
            consumer.close()

    def _process_order_event(self, data):
        order_id = data.get("order_id")
        amount = data.get("amount")
        user_id = data.get("user_id")

        # 1. Create Payment Intent via Stripe
        provider = StripePaymentProvider(api_key=settings.STRIPE_SECRET_KEY)
        intent = provider.create_payment_intent(amount=amount, currency="usd", metadata={"order_id": order_id})

        # 2. Save local transaction record
        Transaction.objects.get_or_create(
            order_id=order_id,
            defaults={
                "provider_transaction_id": intent["provider_transaction_id"],
                "amount": amount,
                "status": Transaction.Status.PENDING
            }
        )

        kafka_producer.publish_PaymentIntentCreated(order_id=order_id, payment_intent_id = intent["provider_transaction_id"], 
                                                   client_secret=intent["client_secret"])
                    