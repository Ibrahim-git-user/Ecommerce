from confluent_kafka import Producer
import json
from django.conf import settings

class KafkaProducerService:
    def __init__(self):
        self.producer = Producer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'client.id': 'order-service'
        })
    
    def publish_order_created(self, order_id, user_id, amount):
        try:
            message = {
                'event_type': 'order.created',
                'order_id': order_id,
                'user_id': user_id,
                'amount': amount,
            }
            self.producer.produce(
                topic='orders',
                key=str(order_id).encode('utf-8'),
                value=json.dumps(message).encode('utf-8')
            )
            self.producer.flush()
        except Exception as e:
            print (e)

kafka_producer = KafkaProducerService()