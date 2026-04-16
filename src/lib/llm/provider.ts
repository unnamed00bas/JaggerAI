export interface LlmMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LlmStreamHandlers {
  onToken?: (delta: string) => void
  signal?: AbortSignal
}

export interface LlmProvider {
  name: string
  chat(messages: LlmMessage[], model: string, apiKey: string, baseUrl?: string): Promise<string>
  /** Stream tokens. Returns the full reply when done. */
  stream(
    messages: LlmMessage[],
    model: string,
    apiKey: string,
    handlers: LlmStreamHandlers,
    baseUrl?: string,
  ): Promise<string>
}

// ─── SSE line parser ────────────────────────────────────────────────

async function readSseLines(
  res: Response,
  onEvent: (data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!res.body) throw new Error('No response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    if (signal?.aborted) {
      reader.cancel().catch(() => {})
      throw new DOMException('Aborted', 'AbortError')
    }
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      onEvent(payload)
    }
  }
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text()
    return text.slice(0, 400)
  } catch {
    return ''
  }
}

// ─── Claude (Anthropic) ─────────────────────────────────────────────

const CLAUDE_DEFAULT_MODEL = 'claude-sonnet-4-5'

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
        model: model || CLAUDE_DEFAULT_MODEL,
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!response.ok) {
      throw new Error(`Claude API error ${response.status}: ${await readErrorBody(response)}`)
    }
    const data = await response.json()
    return data.content[0].text
  },

  async stream(messages, model, apiKey, handlers) {
    const systemMsg = messages.find((m) => m.role === 'system')
    const chatMessages = messages.filter((m) => m.role !== 'system')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: handlers.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || CLAUDE_DEFAULT_MODEL,
        max_tokens: 4096,
        stream: true,
        system: systemMsg?.content,
        messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!response.ok) {
      throw new Error(`Claude API error ${response.status}: ${await readErrorBody(response)}`)
    }
    let full = ''
    await readSseLines(
      response,
      (payload) => {
        try {
          const evt = JSON.parse(payload)
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            const token = evt.delta.text as string
            full += token
            handlers.onToken?.(token)
          }
        } catch {
          // ignore non-JSON keepalives
        }
      },
      handlers.signal,
    )
    return full
  },
}

// ─── OpenAI ────────────────────────────────────────────────────────

const openaiProvider: LlmProvider = {
  name: 'openai',
  async chat(messages, model, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
      }),
    })
    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}: ${await readErrorBody(response)}`)
    }
    const data = await response.json()
    return data.choices[0].message.content
  },

  async stream(messages, model, apiKey, handlers) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: handlers.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
        stream: true,
      }),
    })
    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}: ${await readErrorBody(response)}`)
    }
    let full = ''
    await readSseLines(
      response,
      (payload) => {
        try {
          const evt = JSON.parse(payload)
          const token = evt.choices?.[0]?.delta?.content
          if (typeof token === 'string' && token.length) {
            full += token
            handlers.onToken?.(token)
          }
        } catch {
          /* ignore */
        }
      },
      handlers.signal,
    )
    return full
  },
}

// ─── GLM (Zhipu) ───────────────────────────────────────────────────

const glmProvider: LlmProvider = {
  name: 'glm',
  async chat(messages, model, apiKey, baseUrl) {
    const base = (baseUrl || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, '')
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'glm-4-flash',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
      }),
    })
    if (!response.ok) {
      throw new Error(`GLM API error ${response.status}: ${await readErrorBody(response)}`)
    }
    const data = await response.json()
    return data.choices[0].message.content
  },

  async stream(messages, model, apiKey, handlers, baseUrl) {
    const base = (baseUrl || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, '')
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: handlers.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'glm-4-flash',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
        stream: true,
      }),
    })
    if (!response.ok) {
      throw new Error(`GLM API error ${response.status}: ${await readErrorBody(response)}`)
    }
    let full = ''
    await readSseLines(
      response,
      (payload) => {
        try {
          const evt = JSON.parse(payload)
          const token = evt.choices?.[0]?.delta?.content
          if (typeof token === 'string' && token.length) {
            full += token
            handlers.onToken?.(token)
          }
        } catch {
          /* ignore */
        }
      },
      handlers.signal,
    )
    return full
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
