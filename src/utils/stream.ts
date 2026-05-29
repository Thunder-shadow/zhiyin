import Taro from '@tarojs/taro'

/**
 * SSE 流式请求工具
 * 支持 H5 (fetch ReadableStream) 和小程序 (enableChunked)
 */

export interface StreamCallbacks {
  onChunk: (_content: string) => void
  onDone: (_data?: any) => void
  onError: (_message: string) => void
}

/** 构建完整 URL */
function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${PROJECT_DOMAIN}${path}`
}

/**
 * 发起流式 SSE 请求
 * H5 端使用 fetch + ReadableStream 解析 SSE
 * 小程序端使用 Taro.request + enableChunked
 */
export async function fetchStream(
  url: string,
  body: Record<string, any>,
  callbacks: StreamCallbacks
): Promise<void> {
  const fullUrl = buildUrl(url)
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  if (isH5) {
    return fetchStreamH5(fullUrl, body, callbacks)
  } else {
    return fetchStreamMiniApp(fullUrl, body, callbacks)
  }
}

/** H5 端：fetch + ReadableStream 解析 SSE */
async function fetchStreamH5(fullUrl: string, body: Record<string, any>, callbacks: StreamCallbacks) {
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      callbacks.onError(`请求失败: ${response.status}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError('无法读取响应流')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (!dataStr) continue
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.type === 'content' && parsed.content) {
              callbacks.onChunk(parsed.content)
            } else if (parsed.type === 'done') {
              callbacks.onDone(parsed.data)
            } else if (parsed.type === 'error') {
              callbacks.onError(parsed.message || '未知错误')
            }
          } catch {
            // 忽略非JSON行
          }
        }
      }
    }

    // 处理剩余buffer
    if (buffer.startsWith('data: ')) {
      const dataStr = buffer.slice(6).trim()
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.type === 'done') {
            callbacks.onDone(parsed.data)
          }
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    callbacks.onError('网络连接失败')
  }
}

/** 小程序端：Taro.request + enableChunked */
async function fetchStreamMiniApp(fullUrl: string, body: Record<string, any>, callbacks: StreamCallbacks) {
  return new Promise<void>((resolve) => {
    let buffer = ''
    let resolved = false
    let hasReceivedChunks = false

    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }

    try {
      // eslint-disable-next-line no-restricted-properties -- enableChunked 流式传输需要 Taro.request
      const requestTask = Taro.request({
        url: fullUrl,
        method: 'POST',
        data: body,
        header: { 'Content-Type': 'application/json' },
        enableChunked: true,
        success: (res) => {
          // 如果已经通过 onChunkReceived 处理过，不再处理
          if (hasReceivedChunks) {
            finish()
            return
          }
          // 部分小程序不支持 enableChunked，走完整响应
          if (res.statusCode === 200 && res.data) {
            const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
            parseSSEText(text, callbacks)
          } else {
            callbacks.onError('请求失败')
          }
          finish()
        },
        fail: (_err) => {
          if (!hasReceivedChunks) {
            callbacks.onError('请求失败')
          }
          finish()
        }
      })

      // 监听分块数据（微信小程序）
      if (requestTask && typeof requestTask.onChunkReceived === 'function') {
        requestTask.onChunkReceived((res) => {
          hasReceivedChunks = true
          try {
            const uint8 = new Uint8Array(res.data)
            let text = ''
            if (typeof TextDecoder !== 'undefined') {
              text = new TextDecoder('utf-8').decode(uint8)
            } else {
              // 手动 UTF-8 解码，支持中文等多字节字符
              let i = 0
              while (i < uint8.length) {
                let codePoint: number
                if (uint8[i] < 0x80) {
                  codePoint = uint8[i]
                  i += 1
                } else if ((uint8[i] & 0xe0) === 0xc0) {
                  if (i + 1 >= uint8.length) break
                  codePoint = ((uint8[i] & 0x1f) << 6) | (uint8[i + 1] & 0x3f)
                  i += 2
                } else if ((uint8[i] & 0xf0) === 0xe0) {
                  if (i + 2 >= uint8.length) break
                  codePoint = ((uint8[i] & 0x0f) << 12) | ((uint8[i + 1] & 0x3f) << 6) | (uint8[i + 2] & 0x3f)
                  i += 3
                } else if ((uint8[i] & 0xf8) === 0xf0) {
                  if (i + 3 >= uint8.length) break
                  codePoint = ((uint8[i] & 0x07) << 18) | ((uint8[i + 1] & 0x3f) << 12) | ((uint8[i + 2] & 0x3f) << 6) | (uint8[i + 3] & 0x3f)
                  i += 4
                } else {
                  codePoint = uint8[i]
                  i += 1
                }
                text += String.fromCodePoint(codePoint)
              }
            }
            buffer += text

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim()
                if (!dataStr) continue
                try {
                  const parsed = JSON.parse(dataStr)
                  if (parsed.type === 'content' && parsed.content) {
                    callbacks.onChunk(parsed.content)
                  } else if (parsed.type === 'done') {
                    callbacks.onDone(parsed.data)
                    finish()
                  } else if (parsed.type === 'error') {
                    callbacks.onError(parsed.message || '未知错误')
                    finish()
                  }
                } catch { /* ignore */ }
              }
            }
          } catch (e) {
            // 解析失败，忽略这个 chunk
          }
        })
      }
    } catch (err) {
      callbacks.onError('请求失败')
      finish()
    }
  })
}

/** 解析完整 SSE 文本 */
function parseSSEText(text: string, callbacks: StreamCallbacks) {
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim()
      if (!dataStr) continue
      try {
        const parsed = JSON.parse(dataStr)
        if (parsed.type === 'content' && parsed.content) {
          callbacks.onChunk(parsed.content)
        } else if (parsed.type === 'done') {
          callbacks.onDone(parsed.data)
        } else if (parsed.type === 'error') {
          callbacks.onError(parsed.message || '未知错误')
        }
      } catch { /* ignore */ }
    }
  }
}
