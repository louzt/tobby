export interface ISocket {
  onopen: (() => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onerror: ((error: Error) => void) | null
  onclose: (() => void) | null

  send(data: string): void
  close(): void
  readyState: number
}

export interface SocketTransportContext {
  url: string
}

export type SocketTransportFactory = (context: SocketTransportContext) => ISocket