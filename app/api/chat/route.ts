import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const body = await req.json()
  const { messages, message, reportContext, conversationHistory } = body

  // Handle both streaming chat (messages array) and simple Q&A (message + reportContext)
  if (reportContext && message) {
    // Simple Q&A mode for report discussion
    const systemPrompt = `You are StockFlow AI, an expert financial analyst helping users understand stock performance reports.

The user has a stock performance report displayed on their screen with the following content:

${reportContext}

Answer the user's questions about this report accurately and concisely. Reference specific data points from the report when relevant.`

    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.OPENAI_API_KEY

    if (!apiKey) {
      return Response.json(
        { success: false, error: "API key not configured" },
        { status: 500 }
      )
    }

    try {
      // Build conversation history for context
      const historyMessages = conversationHistory?.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || []

      const result = streamText({
        model: openai("gpt-4o", {
          apiKey: apiKey,
          baseURL: process.env.PERPLEXITY_API_KEY ? "https://api.perplexity.ai" : undefined
        }),
        messages: [
          { role: "system" as const, content: systemPrompt },
          ...historyMessages,
          { role: "user" as const, content: message }
        ],
        maxTokens: 800,
        temperature: 0.7,
        abortSignal: req.signal,
      })

      // Return streaming response
      return result.toDataStreamResponse()
    } catch (error: any) {
      console.error('Chat API error:', error)
      return Response.json(
        { success: false, error: error.message || 'Failed to get response' },
        { status: 500 }
      )
    }
  }

  // Original streaming chat mode
  const systemPrompt = `You are StockFlow AI, an expert financial advisor and stock market analyst. You help users with:

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

  // Use PERPLEXITY_API_KEY if available, otherwise fall back to OPENAI_API_KEY
  const apiKey = process.env.PERPLEXITY_API_KEY || process.env.OPENAI_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured. Please set PERPLEXITY_API_KEY or OPENAI_API_KEY in your environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const result = streamText({
    model: openai("gpt-4o", {
      apiKey: apiKey,
      baseURL: process.env.PERPLEXITY_API_KEY ? "https://api.perplexity.ai" : undefined
    }),
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
