import { describe, it, expect, beforeEach } from 'vitest'
import { ActionRegistry } from '@/actions'
import { registerServerActions } from '@/actions/serverActions'
import { CommandParser } from '@/services/commands'
import { useStore } from '@/store'
import type { ActionContext } from '@/types'
import type { AppStore } from '@/store'

const makeContext = (): ActionContext<AppStore> => ({
  store: useStore.getState(),
  ircClient: null as any,
  renderer: {} as any,
})

describe('/discover command', () => {
  let parser: CommandParser

  beforeEach(() => {
    useStore.setState({ activeModal: null, discoverServerPrefill: null })
    const registry = new ActionRegistry<AppStore>()
    registerServerActions(registry)
    parser = new CommandParser(registry)
  })

  it('opens the discover modal', async () => {
    const result = await parser.parse('/discover', makeContext())

    expect(result.success).toBe(true)
    expect(useStore.getState().activeModal).toBe('discover')
  })

  it('rejects extra arguments', async () => {
    const result = await parser.parse('/discover extra', makeContext())

    expect(result.success).toBe(false)
  })
})
