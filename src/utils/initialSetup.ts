interface InitialSetupOptions {
  setupMode: boolean | undefined
  configuredServerCount: number
}

export function shouldOpenInitialConnectModal({
  setupMode,
  configuredServerCount,
}: InitialSetupOptions): boolean {
  return Boolean(setupMode) || configuredServerCount === 0
}