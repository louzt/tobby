import { afterEach, describe, expect, test, vi } from 'vitest'
import { NodeTCPSocket } from '../../src/lib/nodeTcpSocket'
import {
  createSocketTransport,
  resetSocketTransportFactory,
  setSocketTransportFactory,
} from '../../src/lib/socketTransport'

describe('socketTransport', () => {
  afterEach(() => {
    resetSocketTransportFactory()
  })

  test('allows a custom socket transport to be injected', () => {
    const fakeSocket = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1,
    }

    const factory = vi.fn(() => fakeSocket)
    setSocketTransportFactory(factory)

    const socket = createSocketTransport('irc://example.com:6667')

    expect(factory).toHaveBeenCalledWith({ url: 'irc://example.com:6667' })
    expect(socket).toBe(fakeSocket)
  })

  test('reset restores the default TCP/TLS transport', () => {
    setSocketTransportFactory(() => {
      throw new Error('custom transport should have been reset')
    })
    resetSocketTransportFactory()

    const socket = createSocketTransport('irc://127.0.0.1:65535')

    expect(socket).toBeInstanceOf(NodeTCPSocket)
    socket.close()
  })
})