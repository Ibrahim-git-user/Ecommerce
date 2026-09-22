# services/providers.py
from abc import ABC, abstractmethod
import stripe

class PaymentProviderStrategy(ABC):
    @abstractmethod
    def create_payment_intent(self, amount: int, currency: str, metadata: dict) -> dict:
        pass

class StripePaymentProvider(PaymentProviderStrategy):
    def __init__(self, api_key: str):
        stripe.api_key = api_key

    def create_payment_intent(self, amount: int, currency: str, metadata: dict) -> dict:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            # payment_method= "pm_card_mastercard",
            # confirm=True,
            # automatic_payment_methods={
            # "enabled": True,
            # "allow_redirects": "never"
            # },
            metadata=metadata
        )
        return {"client_secret": intent.client_secret, "provider_transaction_id": intent.id}