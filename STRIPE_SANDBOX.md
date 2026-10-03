# Stripe sandbox setup

The checkout code uses the **AuruNex Ventures sandbox** (`acct_1UMO17LEDPL8gWz7`) and its annual GBP price (`price_1UMQLgLEDPL8gWz7TEDxrG6O`). Checkout is restricted server-side to the signed-in Supabase account `aurunex.ventures@gmail.com`. It never accepts a live Stripe key.

Set these as **server-only deployment secrets**, never as `VITE_` variables or committed `.env` values:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1UMQLgLEDPL8gWz7TEDxrG6O
STRIPE_CHECKOUT_ENABLED=true
```

The sandbox webhook destination `we_1UMQkbLEDPL8gWz7fN3zTvTr` sends `checkout.session.completed` and `customer.subscription.created`, `.updated`, `.deleted` to `https://landingpagebuilder.aurunex.com/api/public/stripe-webhook`. Its signing secret is shown in Stripe Workbench; copy it directly into the deployment secret store.

The first subscription created for the allowed account receives **9 free days** through Checkout's `subscription_data[trial_period_days]`. Later subscriptions skip the trial. Premium access comes from verified Stripe subscription webhooks, not the return URL. The Stripe Billing Portal handles management and cancellation.

To request Stripe Managed Payments in Checkout, set `STRIPE_MANAGED_PAYMENTS_ENABLED=true` after accepting its terms and confirming the sandbox integration. Live payments require separate work; this code explicitly rejects `sk_live_` keys.
