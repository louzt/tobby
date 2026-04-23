import { NodeTCPSocket } from './nodeTcpSocket'
import type { ISocket, SocketTransportContext, SocketTransportFactory } from './socketTypes'

const defaultSocketTransportFactory: SocketTransportFactory = ({ url }) => new NodeTCPSocket(url)

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