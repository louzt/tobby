import { NodeTCPSocket } from './nodeTcpSocket'
import { NodeWebSocket } from './nodeWebSocket'
import type { ISocket, SocketTransportContext, SocketTransportFactory } from './socketTypes'

function createDefaultSocketTransport(url: string): ISocket {
  const protocol = new URL(url).protocol

  switch (protocol) {
    case 'irc:':
    case 'ircs:':
      return new NodeTCPSocket(url)
    case 'ws:':
    case 'wss:':
      return new NodeWebSocket(url)
    default:
      throw new Error(`Unsupported socket transport protocol: ${protocol}`)
  }
}

export function buildSocketTransportUrl(host: string, port: number): string {
  const normalizedHost = host.trim()

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedHost)) {
    const protocol = new URL(normalizedHost).protocol

    switch (protocol) {
      case 'irc:':
      case 'ircs:':
      case 'ws:':
      case 'wss:':
        return normalizedHost
      default:
        throw new Error(`Unsupported socket transport protocol: ${protocol}`)
    }
  }

  return `${port === 6697 || port === 6679 ? 'ircs' : 'irc'}://${normalizedHost}:${port}`
}

const defaultSocketTransportFactory: SocketTransportFactory = ({ url }) => createDefaultSocketTransport(url)

let socketTransportFactory: SocketTransportFactory = defaultSocketTransportFactory

export function createSocketTransport(url: string): ISocket {
  return socketTransportFactory({ url })
}

export function setSocketTransportFactory(factory: SocketTransportFactory): void {
  socketTransportFactory = factory
}

export function resetSocketTransportFactory(): void {
  socketTransportFactory = defaultSocketTransportFactory
}

export type { ISocket, SocketTransportContext, SocketTransportFactory }