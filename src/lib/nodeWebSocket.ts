import type { ISocket } from './socketTypes'

interface WebSocketLike {
  readyState: number
  addEventListener(event: 'open' | 'message' | 'error' | 'close', listener: (event?: unknown) => void): void
  send(data: string): void
  close(): void
}

interface WebSocketConstructorLike {
  new (url: string): WebSocketLike
}

function decodeBytes(bytes: Uint8Array): string {
  if (typeof globalThis.TextDecoder !== 'undefined') {
    return new globalThis.TextDecoder().decode(bytes)
  }

  return Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('')
}

async function messageDataToText(data: unknown): Promise<string> {
  if (typeof data === 'string') {
    return data
  }

  if (typeof globalThis.Blob !== 'undefined' && data instanceof globalThis.Blob) {
    return data.text()
  }

  if (data instanceof ArrayBuffer) {
    return decodeBytes(new Uint8Array(data))
  }

  if (ArrayBuffer.isView(data)) {
    return decodeBytes(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  }

  return String(data)
}

export class NodeWebSocket implements ISocket {
  private socket: WebSocketLike

  public onopen: (() => void) | null = null
  public onmessage: ((event: { data: string }) => void) | null = null
  public onerror: ((error: Error) => void) | null = null
  public onclose: (() => void) | null = null

  constructor(url: string) {
    const WebSocketImpl = globalThis.WebSocket as WebSocketConstructorLike | undefined

    if (!WebSocketImpl) {
      throw new Error('WebSocket transport is unavailable in this runtime')
    }

    this.socket = new WebSocketImpl(url)

    this.socket.addEventListener('open', () => {
      this.onopen?.()
    })

    this.socket.addEventListener('message', (event) => {
      const messageEvent = event as { data: unknown }
      void this.handleMessage(messageEvent.data)
    })

    this.socket.addEventListener('error', () => {
      this.onerror?.(new Error(`WebSocket connection failed for ${url}`))
    })

    this.socket.addEventListener('close', () => {
      this.onclose?.()
    })
  }

  get readyState(): number {
    return this.socket.readyState
  }

  send(data: string): void {
    if (this.readyState !== 1) {
      throw new Error('Socket is not connected')
    }

    if (!data.endsWith('\r\n')) {
      data += '\r\n'
    }

    this.socket.send(data)
  }

  close(): void {
    if (this.readyState === 0 || this.readyState === 1) {
      this.socket.close()
    }
  }

  private async handleMessage(data: unknown): Promise<void> {
    const text = await messageDataToText(data)
    globalThis.debugLog?.(`[WebSocket] received ${text.substring(0, 500)}`)
    this.onmessage?.({ data: text })
  }
}