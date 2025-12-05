---
name: Multi-Model AX Evaluation Implementation Plan
overview: ""
todos:
  - id: 0f1fcabc-7045-4236-acfd-f714b5a8e8ff
    content: Update types/index.ts to support multi-model AX results
    status: pending
  - id: 23b9170d-5c12-4208-b6c5-ce1a6685beb6
    content: Implement OpenRouter client and multi-model logic in lib/ax-evaluator.ts
    status: pending
  - id: 43349015-e23c-449a-bd98-47eac8a79213
    content: Update worker script to use multi-model evaluation
    status: pending
  - id: 32805860-f060-4e0d-adfc-d54d6d24ac27
    content: Update Agent Experience UI component to show comparison and aggregate
    status: pending
---

# Multi-Model AX Evaluation Implementation Plan

## Overview

This plan upgrades the Agent Experience (AX) evaluation system to use multiple LLMs via OpenRouter (Gemini, OpenAI, Claude, Grok, GLM) instead of just Claude. The results will be displayed both individually (side-by-side comparison) and as an aggregated score.

## Implementation Steps

1.  **Dependencies & Environment**:

    -   Add `openrouter` configuration support.
    -   Ensure `OPENROUTER_API_KEY` is handled in environment variables (user needs to add this).

2.  **Type Definitions (`types/index.ts`)**:

    -   Update `AgentExperience` interface to support multiple model scores.
    -   Create a new `ModelAXScore` interface for individual model results.

3.  **AX Evaluator Logic (`lib/ax-evaluator.ts`)**:

    -   Refactor `createAXEvaluationPrompt` to be reusable across models.
    -   Implement `evaluateWithOpenRouter` function to handle requests to different models.
    -   Create `runMultiModelAXEvaluation` function to:
        -   Run evaluations in parallel (using `Promise.all`) to minimize performance impact.
            -   Google Gemini Flash 1.5
            -   OpenAI GPT-4o (Codex equivalent)
            -   Anthropic Claude 3.5 Sonnet (Opus 4.5 equivalent)
            -   xAI Grok Beta
            -   Zhipu GLM-4
        -   Aggregate scores (calculate average).
        -   Return structured data with both individual and aggregated results.

4.  **Worker Script (`scripts/evaluate-product.ts`)**:

    -   Update `enrichWithAXAnalysis` to call the new multi-model evaluation function.
    -   Pass the aggregated and individual results to the final evaluation object.

5.  **Frontend Components (`components/agent-experience-section.tsx`)**:

    -   Update UI to display:
        -   Overall Aggregated Score (Primary Gauge).
        -   "Council of Agents" breakdown: Side-by-side comparison cards/chart for each model's score.
        -   Consensus Analysis: Highlight where models agree/disagree.

6.  **Database Migration**:

    -   Ensure the `evaluation_jobs` or `evaluations` table `result` JSON column can store the new structure (should be schema-less JSON, so likely no migration needed, but verification is good).

## Models to Support (via OpenRouter)

-   **Gemini**: `google/gemini-flash-1.5`
-   **Codex/GPT**: `openai/gpt-4o`
-   **Claude**: `anthropic/claude-3.5-sonnet` (or specific version requested)
-   **Grok**: `x-ai/grok-beta`
-   **GLM**: `zhipu/glm-4`

## Verification

-   Test with a mock product URL.
-   Verify all 5 models return scores.
-   Verify aggregation logic.