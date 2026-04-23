import { afterEach, describe, expect, test, vi } from 'vitest'
import net from 'net'
import { NodeTCPSocket } from '../../src/lib/nodeTcpSocket'
import { NodeWebSocket } from '../../src/lib/nodeWebSocket'
import {
  buildSocketTransportUrl,
  createSocketTransport,
  resetSocketTransportFactory,
  setSocketTransportFactory,
} from '../../src/lib/socketTransport'

const originalWebSocket = globalThis.WebSocket
const globalObject = globalThis as { WebSocket?: unknown }

describe('socketTransport', () => {
  afterEach(() => {
    resetSocketTransportFactory()

    if (originalWebSocket) {
      globalObject.WebSocket = originalWebSocket
    } else {
      Reflect.deleteProperty(globalObject, 'WebSocket')
    }
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

  test('default transport routes websocket URLs to the websocket wrapper', () => {
    const addEventListener = vi.fn()
    const close = vi.fn()
    const send = vi.fn()
    const constructedUrls: string[] = []

    class WebSocketStub {
      readyState = 0

      constructor(public url: string) {
        constructedUrls.push(url)
      }

      addEventListener = addEventListener
      close = close
      send = send
    }

    globalObject.WebSocket = WebSocketStub

    const socket = createSocketTransport('wss://irc.example.com/webirc')

    expect(constructedUrls).toEqual(['wss://irc.example.com/webirc'])
    expect(addEventListener).toHaveBeenCalledTimes(4)
    expect(socket).toBeInstanceOf(NodeWebSocket)
  })

  test('buildSocketTransportUrl preserves explicit websocket URLs', () => {
    expect(buildSocketTransportUrl('wss://irc.example.com/webirc', 6697)).toBe(
      'wss://irc.example.com/webirc'
    )
  })

  test('buildSocketTransportUrl rejects unsupported explicit protocols', () => {
    expect(() => buildSocketTransportUrl('https://example.com/socket', 443)).toThrow(
      'Unsupported socket transport protocol: https:'
    )
  })
})