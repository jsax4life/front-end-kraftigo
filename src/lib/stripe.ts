import { loadStripe, type Stripe } from '@stripe/stripe-js'

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()

/** Resolves `null` when the publishable key is missing (avoid `loadStripe(undefined)` / hung Elements). */
const stripePromise: Promise<Stripe | null> = pk
  ? loadStripe(pk)
  : Promise.resolve(null)

export default stripePromise
