import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const systemPrompt = `You are StockFlow Pro AI, an expert financial advisor and stock market analyst. You help users with:

1. Stock analysis and recommendations
2. Market trends and insights
3. Trading strategies and advice
4. Portfolio management guidance
5. Financial education and explanations

Key guidelines:
- Provide accurate, helpful financial information
- Always include disclaimers about investment risks
- Use clear, professional language
- Reference current market conditions when relevant
- Suggest users do their own research before making investment decisions
- Be conversational but authoritative

Current market context:
- Major indices: S&P 500 at 4,567.89 (+1.2%), NASDAQ at 14,234.56 (+0.8%), DOW at 34,123.45 (-0.3%)
- Trending stocks: AAPL, TSLA, GOOGL, MSFT, AMZN, NVDA
- Market sentiment: Generally bullish with some sector rotation

Remember to always include appropriate disclaimers about investment risks and the importance of doing personal research.`

  const prompt = [{ role: "system" as const, content: systemPrompt }, ...convertToModelMessages(messages)]

  const result = streamText({
    model: openai("gpt-4o"),
    messages: prompt,
    maxTokens: 1000,
    temperature: 0.7,
    abortSignal: req.signal,
  })

  return result.toDataStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("Chat request aborted")
      }
    },
  })
}
