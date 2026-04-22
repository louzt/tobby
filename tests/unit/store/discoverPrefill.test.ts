import { describe, expect, it, beforeEach } from 'vitest'
import { useStore } from '@/store'

describe('discover server prefill state', () => {
  beforeEach(() => {
    useStore.setState({ discoverServerPrefill: null, activeModal: null })
  })

  it('stores discover prefill values until consumed', () => {
    useStore.getState().setDiscoverServerPrefill({
      name: 'h4ks.com',
      host: 'irc.h4ks.com',
      port: 6697,
    })

    expect(useStore.getState().discoverServerPrefill).toEqual({
      name: 'h4ks.com',
      host: 'irc.h4ks.com',
      port: 6697,
    })
  })

  it('clears discover prefill values when reset', () => {
    useStore.getState().setDiscoverServerPrefill({
      name: 'Ergo Test Network',
      host: 'testnet.ergo.chat',
      port: 6697,
    })

    useStore.getState().setDiscoverServerPrefill(null)

    expect(useStore.getState().discoverServerPrefill).toBeNull()
  })
})
