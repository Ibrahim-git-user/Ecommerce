import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import './App.css'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function CheckoutForm({ clientSecret, onCancel, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      alert('Payment successful!')
      onSuccess?.()
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <PaymentElement />

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="payment-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Back
        </button>
        <button type="submit" disabled={!stripe || isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Pay now'}
        </button>
      </div>
    </form>
  )
}

function Catalog() {
  const products = [
    {
      id: 1,
      name: 'Laptop Pro',
      price: 999.99,
      description: 'A high-performance laptop for work and entertainment.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      name: 'Wireless Headphones',
      price: 149.5,
      description: 'Noise-canceling audio with long battery life.',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      name: 'Smart Watch',
      price: 199.99,
      description: 'Track fitness and stay connected everywhere.',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    },
  ]

  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return

    setIsProcessing(true)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/order/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map(({ id, name, price, quantity }) => ({
            product_id: id,
            product_name: name,
            price,
            quantity,
          })),
          total_amount: totalPrice,
          currency: 'usd',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Checkout failed: ${response.status}`)
      }

      const respData = await response.json()
      let retryCount = 20;
      let paymentDetails = null;
      const payment_details_url = `/order/payment_details/${respData.id}/`
      while (retryCount-- > 0){
      const paymentDetailsResponse = await fetch(payment_details_url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      // console.log('payment details resp status')
      // console.log(paymentDetailsResponse.ok)

      if (!paymentDetailsResponse.ok) {
        const errorText = await paymentDetailsResponse.text()
        throw new Error(errorText || `Failed to retrieve payment details: ${paymentDetailsResponse.status}`)
      }

      paymentDetails = await paymentDetailsResponse.json()

      // console.log('payment details')
      // console.log(paymentDetails)

      if (paymentDetails.client_secret) {
        break;
      }
      await sleep(1000); // Wait for 1 second before retrying
    }
    if (!paymentDetails.client_secret) {
        throw new Error('No client secret returned from the backend.')
      }

      setClientSecret(paymentDetails.client_secret)
    } catch (error) {
      console.error('Stripe checkout error:', error)
      alert(error.message || 'Unable to complete checkout. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPayment = () => {
    setClientSecret('')
    setCart([])
    setIsCartOpen(false)
  }

  const CheckOutComponent = () => {
    if (clientSecret) {
      return (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
          }}
        >
          <CheckoutForm
            clientSecret={clientSecret}
            onCancel={() => setClientSecret('')}
            onSuccess={resetPayment}
          />
        </Elements>
      )
    }

    return (
      <button
        type="button"
        className="checkout-button"
        onClick={handleCheckout}
        disabled={cart.length === 0 || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Checkout with Stripe'}
      </button>
    )
  }

  const CartPanel = () => (
    <div className="cart-panel">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              <img src={item.image} alt={item.name} width="60" />
              <div>
                <h4>{item.name}</h4>
                <p>Price: ${item.price.toFixed(2)} × {item.quantity}</p>
                <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p>Total: ${totalPrice.toFixed(2)}</p>
    </div>
  )

  return (
    <div className="app">
      <div className="page-layout">
        <main className="catalog-column">
          <header className="topbar">
            <h1>Product Catalog</h1>
          </header>

          <div className="products">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <img src={product.image} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>

                <div className="product-footer">
                  <strong>${product.price.toFixed(2)}</strong>
                  <button type="button" onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside className={`cart-column ${isCartOpen ? 'open' : ''}`}>
          <button
            type="button"
            className="cart-toggle"
            onClick={() => setIsCartOpen((prev) => !prev)}
          >
            Cart ({totalItems})
          </button>

          {isCartOpen && <CartPanel />}
          {isCartOpen && <CheckOutComponent />}
        </aside>
      </div>
    </div>
  )
}

export default Catalog
