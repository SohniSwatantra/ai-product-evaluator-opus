---
name: Implement AX Council Visualization
overview: ""
todos:
  - id: b10f12a7-c6c6-4ef6-b4ea-98a6e1897991
    content: Install stripe package
    status: pending
  - id: 589f8b9b-9e40-47d6-a822-eeae6025df6f
    content: Update lib/db.ts with schema and helper functions
    status: pending
  - id: ce21526b-1936-4b13-a31d-06e5195da665
    content: Create lib/stripe.ts and checkout/webhook API routes
    status: pending
  - id: 64d47349-e613-4624-88dc-fe80fd0a2fe5
    content: Create user credits API route
    status: pending
  - id: e321a621-da20-480e-ba07-4cb1d586253a
    content: Create PricingModal and CreditBalance components
    status: pending
  - id: 32b545a1-5c6b-4771-98b1-d1f75820f062
    content: Update Navbar to show credits/buy button
    status: pending
  - id: 2f826f61-d61a-4bcf-ade3-88e189e67416
    content: Update ProductUrlForm to calculate cost and gate analysis
    status: pending
  - id: 8ea1d175-6df1-4110-80a3-29994cd959a6
    content: Update evaluate API to deduct credits and handle multi-model logic
    status: pending
  - id: fc3a579c-522d-4ecd-a77e-7194bc9fb813
    content: Update types/index.ts with AXCouncilResult
    status: pending
  - id: 7dba159b-5c8f-42a7-94a8-e607c3374fd4
    content: Create components/ax-council.tsx
    status: pending
  - id: 858d2c30-90fe-4113-b695-71b4b76959fb
    content: Update components/evaluation-dashboard.tsx to include AX Council
    status: pending
---

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