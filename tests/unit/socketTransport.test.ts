import { afterEach, describe, expect, test, vi } from 'vitest'
import net from 'net'
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
    const sentinel = vi.fn(() => {
      throw new Error('custom transport should have been reset')
    })
    const fakeSocket = {
      on: vi.fn().mockReturnThis(),
      end: vi.fn(),
      write: vi.fn(),
    } as unknown as net.Socket

    const connectSpy = vi.spyOn(net, 'connect').mockReturnValue(fakeSocket)

    setSocketTransportFactory(sentinel)
    resetSocketTransportFactory()

    const socket = createSocketTransport('irc://127.0.0.1:65535')

    expect(sentinel).not.toHaveBeenCalled()
    expect(connectSpy).toHaveBeenCalledWith({ host: '127.0.0.1', port: 65535 })
    expect(socket).toBeInstanceOf(NodeTCPSocket)
  })
})