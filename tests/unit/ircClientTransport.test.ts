import { afterEach, describe, expect, test, vi } from 'vitest'
import { IRCClient } from '../../src/utils/ircClient'
import { resetSocketTransportFactory, setSocketTransportFactory } from '../../src/lib/socketTransport'

describe('IRCClient transport URL selection', () => {
  afterEach(() => {
    resetSocketTransportFactory()
  })

  test('passes explicit websocket URLs through to the transport factory', async () => {
    const fakeSocket = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0,
    }

    const factory = vi.fn(() => fakeSocket)
    setSocketTransportFactory(factory)

    const client = new IRCClient()

    await client.connect(
      'WebIRC',
      'wss://irc.example.com/webirc',
      6697,
      'testnick',
      undefined,
      undefined,
      undefined,
      'server-1'
    )

    expect(factory).toHaveBeenCalledWith({ url: 'wss://irc.example.com/webirc' })
  })

  test('keeps deriving ircs:// URLs for standard secure IRC hosts', async () => {
    const fakeSocket = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0,
    }

    const factory = vi.fn(() => fakeSocket)
    setSocketTransportFactory(factory)

    const client = new IRCClient()

    await client.connect(
      'Libera',
      'irc.libera.chat',
      6697,
      'testnick',
      undefined,
      undefined,
      undefined,
      'server-2'
    )

    expect(factory).toHaveBeenCalledWith({ url: 'ircs://irc.libera.chat:6697' })
  })
})