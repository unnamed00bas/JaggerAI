export interface LlmMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LlmProvider {
  name: string
  chat(messages: LlmMessage[], model: string, apiKey: string, baseUrl?: string): Promise<string>
}

const claudeProvider: LlmProvider = {
  name: 'claude',
  async chat(messages, model, apiKey) {
    const systemMsg = messages.find((m) => m.role === 'system')
    const chatMessages = messages.filter((m) => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemMsg?.content,
        messages: chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  },
}

const openaiProvider: LlmProvider = {
  name: 'openai',
  async chat(messages, model, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  },
}

const glmProvider: LlmProvider = {
  name: 'glm',
  async chat(messages, model, apiKey, baseUrl) {
    const url = baseUrl
      ? `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`
      : 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'glm-4-flash',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`GLM API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  },
}

export const LLM_PROVIDERS: Record<string, LlmProvider> = {
  claude: claudeProvider,
  openai: openaiProvider,
  glm: glmProvider,
}

export function getProvider(name: string): LlmProvider | undefined {
  return LLM_PROVIDERS[name]
}
