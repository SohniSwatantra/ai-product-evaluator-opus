<!-- c567eb2d-2f00-4ad0-ab1f-9b891939b79e 5168fac0-01d1-4646-9597-ec7f7718e165 -->
# Implement AX Council Visualization

I will implement the "AX Council" visualization feature. This involves creating a visual representation of the AI Advisory Board with 5 model members and 1 leader (AX Council).

**Requirements**:

-   **Visuals**: 5 "Person" avatars for models + 1 Central "Leader" avatar (Orange).
-   **Layout**: Arranged to resemble a council/board.
-   **Scores**: Displayed **just above the head** of each person.
-   **Text**: Title "AX Council", Subtitle "Your Local Multi-Model AI Advisory Board".

## 1. Update Types

-   **Modify `types/index.ts`**:
    -   Update `ProductEvaluation` interface to optionally include `axCouncilResult: AXCouncilResult`.

## 2. Frontend Implementation

-   **Create `components/ax-council.tsx`**:
    -   **Component Structure**:
        -   A container for the "Council Table" or layout.
        -   **Members**: 5 slots for the individual models (OpenAI, Anthropic, Google, etc.).
            -   Visual: A silhouette/avatar of a person.
            -   Color: Specific glow/color for each model (e.g., Green for OpenAI, Purple for Anthropic).
            -   Score Badge: Floating above the head.
        -   **Leader (AX Council)**:
            -   Visual: A distinct, larger, or central avatar.
            -   Color: **Orange** theme.
            -   Score Badge: Floating above the head (Final Score).
    -   **Styling**:
        -   Use Tailwind for positioning and colors.
        -   Use `framer-motion` (if available) or CSS transitions for a polished feel.
        -   Background: Dark/futuristic to match the "Council" vibe.

-   **Update `components/evaluation-dashboard.tsx`**:
    -   Import `AXCouncil`.
    -   Render it within the dashboard, passing the `axCouncilResult` data.
    -   Ensure it handles cases where `axCouncilResult` might be missing (graceful fallback or hide).

## 3. Verification

-   Verify the component renders correctly with mock data.
-   Check the positioning of score badges (above heads).
-   Verify the orange color for the AX Council leader.
-   Verify the correct text labels.

### To-dos

- [ ] Install stripe package
- [ ] Update lib/db.ts with schema and helper functions
- [ ] Create lib/stripe.ts and checkout/webhook API routes
- [ ] Create user credits API route
- [ ] Create PricingModal and CreditBalance components
- [ ] Update Navbar to show credits/buy button
- [ ] Update ProductUrlForm to calculate cost and gate analysis
- [ ] Update evaluate API to deduct credits and handle multi-model logic
- [ ] Update types/index.ts with AXCouncilResult
- [ ] Create components/ax-council.tsx
- [ ] Update components/evaluation-dashboard.tsx to include AX Council