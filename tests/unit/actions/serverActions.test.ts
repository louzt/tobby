import { describe, it, expect, beforeEach } from 'vitest'
import { ActionRegistry } from '@/actions'
import { registerServerActions } from '@/actions/serverActions'
import { useStore } from '@/store'
import { MockIRCClient } from '../mocks/mockIRCClient'
import type { ActionContext } from '@/types'
import type { AppStore } from '@/store'

describe('Server Actions', () => {
  let registry: ActionRegistry<AppStore>
  let mockIRCClient: MockIRCClient
  let context: ActionContext<AppStore>

  beforeEach(() => {
    // Reset store
    useStore.setState({
      servers: [],
      currentServerId: null,
      currentChannelId: null,
      activeModal: null,
      discoverServerPrefill: null,
    })

    registry = new ActionRegistry<AppStore>()
    registerServerActions(registry)

    mockIRCClient = new MockIRCClient()

    context = {
      store: useStore.getState(),
      ircClient: mockIRCClient as any, // Cast to any to bypass full interface requirement for mock
      renderer: {} as any,
    }
  })

  it('should connect to a server and set it as current', async () => {
    const params = {
      name: 'Test Server',
      host: 'irc.test.com',
      port: 6667,
      nickname: 'testuser',
    }

    await registry.execute('server.connectWith', context, params)

    const state = useStore.getState()

    // Check if server was added
    expect(state.servers).toHaveLength(1)
    expect(state.servers[0]!.name).toBe('Test Server')

    expect(state.currentServerId).toBe(state.servers[0]!.id)
  })

  it('opens Add Server directly and clears discover prefill', async () => {
    useStore.setState({
      discoverServerPrefill: {
        name: 'Discover Network',
        host: 'irc.discover.test',
        port: 6697,
      },
    })

    await registry.execute('server.connect', context)

    expect(useStore.getState().activeModal).toBe('connect')
    expect(useStore.getState().discoverServerPrefill).toBeNull()
  })

  it('opens the discover modal', async () => {
    await registry.execute('server.discover', context)

    expect(useStore.getState().activeModal).toBe('discover')
  })
})
