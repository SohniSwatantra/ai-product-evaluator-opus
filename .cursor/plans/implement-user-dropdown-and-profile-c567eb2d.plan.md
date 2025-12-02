<!-- c567eb2d-2f00-4ad0-ab1f-9b891939b79e f410d438-9e34-4c75-8822-aeaad5f6e6fc -->
# Implement Credit System with Stripe

I will implement a prepaid credit system where users buy packs of credits to perform analyses. This involves database updates, Stripe integration, and UI changes to gate functionality.

**Pricing Model**:

-   **1 Credit** = 1 Model Run.
-   **Base Evaluation** (1 Model) = **1 Credit**.
-   **Additional Models**: 1 Credit each (up to 4 additional = 4 Credits).
-   **AX Council**: **Free** (Included if 5 models are run).
-   **Total Max Cost**: 5 Credits per full analysis.
-   **Credit Price**: ~$1.00 USD per credit (sold in packs).

## 1. Database Schema Updates

-   **Modify `lib/db.ts`**:
    -   Update `initDatabase` to create:
        -   `user_credits` table (user_id, balance).
        -   `credit_transactions` table (audit log for purchases/usage).
    -   Add helper functions:
        -   `getUserCredits(userId)`
        -   `addUserCredits(userId, amount, description, transactionId?)`
        -   `deductUserCredit(userId, amount, description)` (Transactional: check balance >= amount, then deduct)

## 2. Stripe Integration (Backend)

-   **Install dependencies**: `stripe`
-   **Create `lib/stripe.ts`**: Initialize Stripe client.
-   **Create API Routes**:
    -   `app/api/stripe/checkout/route.ts`: Creates a Stripe Checkout Session for credit packs.
        -   Pack 1: 5 Credits ($5)
        -   Pack 2: 20 Credits ($15)
        -   Pack 3: 100 Credits ($50)
    -   `app/api/stripe/webhook/route.ts`: Listens for `checkout.session.completed` to fund the user's account.

## 3. API & Backend Logic

-   **Update `app/api/evaluate/route.ts`**:
    -   Accept `selectedModels` array in request body.
    -   Calculate total cost: `cost = selectedModels.length`. (e.g., 1 model = 1 credit, 5 models = 5 credits).
    -   Check user credit balance (`balance >= cost`).
    -   Deduct `cost` credits upon successful job creation.
    -   Return specific error code if insufficient credits.
-   **Create `app/api/user/credits/route.ts`**: Endpoint to fetch current balance for the frontend.

## 4. Frontend Implementation

-   **Create `components/credits/credit-balance.tsx`**: Display current credits.
-   **Create `components/credits/pricing-modal.tsx`**: UI to select credit packs (Starter, Pro, Agency) and trigger checkout.
-   **Update `components/navbar.tsx`**: Show credit balance or "Buy Credits" button.
-   **Update `components/product-url-form.tsx`**:
    -   Calculate required credits based on selected models (1 per model).
    -   Display "Estimated Cost: X Credits".
    -   Check credits before submitting.
    -   Open Pricing Modal if balance < required credits.

## 5. Environment Variables

-   User needs to set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Verification

-   Verify database tables creation.
-   Verify credit purchase flow (mocked if no Stripe keys).
-   Verify deduction logic (1 model = 1 credit, N models = N credits).
-   Verify blocking analysis when balance is insufficient.

### To-dos

- [ ] Install stripe package
- [ ] Update lib/db.ts with schema and helper functions
- [ ] Create lib/stripe.ts and checkout/webhook API routes
- [ ] Create user credits API route
- [ ] Create PricingModal and CreditBalance components
- [ ] Update Navbar to show credits/buy button
- [ ] Update ProductUrlForm to gate analysis and open pricing modal
- [ ] Update evaluate API to check and deduct credits