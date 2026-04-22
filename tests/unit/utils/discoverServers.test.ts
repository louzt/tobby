import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchDiscoverServers,
  normalizeDiscoverServers,
  resetDiscoverServersCache,
  toDiscoverServerPrefill,
} from '@/utils/discoverServers'

describe('discoverServers', () => {
  beforeEach(() => {
    resetDiscoverServersCache()
  })

  it('normalizes the Obsidian server list payload', () => {
    const servers = normalizeDiscoverServers([
      {
        name: 'Example IRC Network',
        description: 'A generic public IRC network.',
        wss: 'wss://irc.example.net:443',
        ircs: 'ircs://irc.example.net:6697',
        obsidian: false,
      },
    ])

    expect(servers).toEqual([
      {
        id: 'irc.example.net:6697',
        name: 'Example IRC Network',
        description: 'A generic public IRC network.',
        host: 'irc.example.net',
        port: 6697,
        ircs: 'ircs://irc.example.net:6697',
        wss: 'wss://irc.example.net:443',
        obsidian: false,
      },
    ])
  })

  it('drops malformed entries instead of poisoning the full list', () => {
    const servers = normalizeDiscoverServers([
      null,
      {},
      { name: 'missing ircs' },
      { name: 'valid', ircs: 'ircs://irc.valid.test:7000' },
    ])

    expect(servers).toHaveLength(1)
    expect(servers[0]?.host).toBe('irc.valid.test')
    expect(servers[0]?.port).toBe(7000)
  })

  it('maps a discover server into Add Server prefill values', () => {
    const [server] = normalizeDiscoverServers([
      {
        name: 'Test Network',
        ircs: 'ircs://irc.test.net:6697',
      },
    ])

    expect(toDiscoverServerPrefill(server!)).toEqual({
      name: 'Test Network',
      host: 'irc.test.net',
      port: 6697,
    })
  })

  it('throws on fetch failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    })

    await expect(fetchDiscoverServers(fetchImpl as unknown as typeof fetch)).rejects.toThrow(
      'Failed to load discover servers: 503 Service Unavailable'
    )
  })

  it('loads and normalizes servers from fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'Ergo Test Network',
          description: 'Testing IRCv3 things.',
          ircs: 'ircs://testnet.ergo.chat:6697',
          obsidian: true,
        },
      ],
    })

    await expect(fetchDiscoverServers(fetchImpl as unknown as typeof fetch)).resolves.toEqual([
      {
        id: 'testnet.ergo.chat:6697',
        name: 'Ergo Test Network',
        description: 'Testing IRCv3 things.',
        host: 'testnet.ergo.chat',
        port: 6697,
        ircs: 'ircs://testnet.ergo.chat:6697',
        wss: undefined,
        obsidian: true,
      },
    ])
  })

  it('reuses cached discover servers after the first successful fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: 'Example IRC Network',
          ircs: 'ircs://irc.example.net:6697',
        },
      ],
    })

    const first = await fetchDiscoverServers(fetchImpl as unknown as typeof fetch)
    const second = await fetchDiscoverServers(fetchImpl as unknown as typeof fetch)

    expect(first).toEqual(second)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
