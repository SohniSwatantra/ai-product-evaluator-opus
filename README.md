# AI Product Evaluator

An AI-powered tool that analyzes e-commerce products and predicts human buying intent based on the research paper **"What Is Your AI Agent Buying?"** (August 2025).

## Features

- 🤖 **AI-Powered Analysis**: Uses Claude AI to evaluate products
- 🎯 **Buying Intent Prediction**: Predicts purchase probability with high accuracy
- 📊 **Multi-Factor Scoring**: Analyzes 6 key factors from research
- 💡 **Actionable Insights**: Get recommendations to improve product appeal
- 🎨 **Beautiful UI**: Built with VioBeCodeFixers styling system
- 🌓 **Dark/Light Mode**: Theme support with next-themes

## Evaluation Factors

Based on the research paper, the AI evaluates products using:

1. **Product Position** - Position effects on search results
2. **Price** - Cost analysis and value proposition
3. **Ratings** - Customer ratings and scores
4. **Reviews** - Quality and quantity of reviews
5. **Sponsored Tags** - Impact of sponsored labels
6. **Platform Endorsements** - "Amazon's Choice" and similar badges

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with VioBeCodeFixers design system
- **AI**: Anthropic Claude 3.5 Sonnet
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key (get one at [https://console.anthropic.com/](https://console.anthropic.com/))

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file with your API key:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3002](http://localhost:3002) in your browser

## Usage

1. Enter a product URL from Amazon, eBay, or other e-commerce sites
2. Click "Analyze Buying Intent"
3. View the comprehensive evaluation including:
   - Overall score (0-100)
   - Buying intent probability (0-100%)
   - Detailed factor analysis
   - AI-generated insights
   - Actionable recommendations

## Research Paper

This tool implements the methodology from:

**"What Is Your AI Agent Buying? Evaluation, Implications and Emerging Questions for Agentic E-Commerce"**
- Published: August 2025
- ArXiv: [2508.02630](https://arxiv.org/abs/2508.02630)

## Powered By

Built with ❤️ using the design system from [VioBeCodeFixers](https://vibecodefixers.com)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
