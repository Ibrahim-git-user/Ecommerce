# payments/management/commands/consume_order_events.py
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from confluent_kafka import Consumer, KafkaError
from orders.models import Order

class Command(BaseCommand):
    help = "Runs background consumer for payment events from Kafka"

    def handle(self, *args, **options):
        consumer = Consumer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'order-service-group',  # Consumer group ID
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False            # Manual commit for financial safety
        })

        consumer.subscribe(['payments'])
        self.stdout.write(self.style.SUCCESS("Listening for payment events..."))

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
                if payload.get("event_type") == "PaymentIntentCreated":
                    self._process_payment_event(payload)
                elif payload.get("event_type") == "PaymentSuccess":
                    self._process_payment_success_event(payload)

                # Commit offset after successful database write
                consumer.commit(msg)

        except KeyboardInterrupt:
            pass
        finally:
            consumer.close()

    def _process_payment_event(self, data):
        order_id = data.get("order_id")
        payment_intent_id = data.get("payment_intent_id")
        client_secret = data.get("client_secret")

        order = Order.objects.get_or_create(
            id=order_id
        )
        order = order[0]
        order.payment_intent_id = payment_intent_id
        order.client_secret = client_secret
        order.save()

    def _process_payment_success_event(self, data):
        order_id = data.get("order_id")
        order = Order.objects.filter(id=order_id).first()
        if order:
            order.status = Order.Status.PAID
            order.save()