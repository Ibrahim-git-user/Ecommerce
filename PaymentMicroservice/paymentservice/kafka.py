from django.conf import settings

from confluent_kafka import Producer
import json

class KafkaProducerService:
    def __init__(self):
        self.producer = Producer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'payment-service'
        })
    
    def publish_PaymentIntentCreated(self, order_id, payment_intent_id, client_secret):
        try:
            message = {
                'event_type': 'PaymentIntentCreated',
                'order_id': order_id,
                'payment_intent_id': payment_intent_id,
                'client_secret': client_secret
            }
            self.producer.produce(
                topic='payments',
                key=str(order_id).encode('utf-8'),
                value=json.dumps(message).encode('utf-8')
            )
            self.producer.flush()
        except Exception as e:
            print (e)

    def publish_PaymentSuccess(self, order_id):
        try:
            message = {
                'event_type': 'PaymentSuccess',
                'order_id': order_id
            }
            self.producer.produce(
                topic='payments',
                key=str(order_id).encode('utf-8'),
                value=json.dumps(message).encode('utf-8')
            )
            self.producer.flush()
        except Exception as e:
            print (e)

kafka_producer = KafkaProducerService()