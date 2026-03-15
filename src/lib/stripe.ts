import { loadStripe } from '@stripe/stripe-js'

// Singleton — loadStripe returns the same promise on every call
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export default stripePromise
