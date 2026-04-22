import { describe, expect, it } from 'vitest'
import { shouldOpenInitialConnectModal } from '@/utils/initialSetup'

describe('shouldOpenInitialConnectModal', () => {
  it('treats undefined setup mode as false when servers already exist', () => {
    expect(shouldOpenInitialConnectModal({ setupMode: undefined, configuredServerCount: 2 })).toBe(
      false
    )
  })

  it('opens in explicit setup mode', () => {
    expect(shouldOpenInitialConnectModal({ setupMode: true, configuredServerCount: 3 })).toBe(
      true
    )
  })

  it('opens on a fresh install with no configured servers', () => {
    expect(shouldOpenInitialConnectModal({ setupMode: false, configuredServerCount: 0 })).toBe(
      true
    )
  })

  it('does not open when servers already exist and setup mode is off', () => {
    expect(shouldOpenInitialConnectModal({ setupMode: false, configuredServerCount: 1 })).toBe(
      false
    )
  })
})