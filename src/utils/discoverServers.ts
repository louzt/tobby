const OBSIDIAN_SERVER_LIST_URL =
  'https://raw.githubusercontent.com/ObsidianIRC/server-list/refs/heads/main/servers.json'

let cachedDiscoverServers: DiscoverServerEntry[] | null = null
let pendingDiscoverServers: Promise<DiscoverServerEntry[]> | null = null

interface RawDiscoverServer {
  name?: string
  description?: string
  wss?: string
  ircs?: string
  obsidian?: boolean
}

export interface DiscoverServerEntry {
  id: string
  name: string
  description?: string
  host: string
  port: number
  ircs: string
  wss?: string
  obsidian: boolean
}

export interface DiscoverServerPrefill {
  name: string
  host: string
  port: number
}

export function toDiscoverServerPrefill(entry: DiscoverServerEntry): DiscoverServerPrefill {
  return {
    name: entry.name,
    host: entry.host,
    port: entry.port,
  }
}

export function normalizeDiscoverServers(payload: unknown): DiscoverServerEntry[] {
  if (!Array.isArray(payload)) {
    throw new Error('Server list payload must be an array')
  }

  return payload.flatMap((item) => {
    const server = parseDiscoverServer(item)
    return server ? [server] : []
  })
}

export async function fetchDiscoverServers(
  fetchImpl: typeof fetch = fetch
): Promise<DiscoverServerEntry[]> {
  if (cachedDiscoverServers) {
    return cachedDiscoverServers
  }

  if (!pendingDiscoverServers) {
    pendingDiscoverServers = (async () => {
      const response = await fetchImpl(OBSIDIAN_SERVER_LIST_URL)
      if (!response.ok) {
        throw new Error(
          `Failed to load discover servers: ${response.status} ${response.statusText}`
        )
      }

      const normalized = normalizeDiscoverServers(await response.json())
      cachedDiscoverServers = normalized
      return normalized
    })()
  }

  try {
    return await pendingDiscoverServers
  } finally {
    pendingDiscoverServers = null
  }
}

export function resetDiscoverServersCache(): void {
  cachedDiscoverServers = null
  pendingDiscoverServers = null
}

function parseDiscoverServer(item: unknown): DiscoverServerEntry | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const raw = item as RawDiscoverServer
  if (!raw.name || !raw.ircs) {
    return null
  }

  const endpoint = parseIrcsUrl(raw.ircs)
  return {
    id: `${endpoint.host}:${endpoint.port}`,
    name: raw.name,
    description: raw.description,
    host: endpoint.host,
    port: endpoint.port,
    ircs: raw.ircs,
    wss: raw.wss,
    obsidian: Boolean(raw.obsidian),
  }
}

function parseIrcsUrl(value: string): { host: string; port: number } {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Invalid ircs URL: ${value}`)
  }

  if (parsed.protocol !== 'ircs:') {
    throw new Error(`Expected ircs URL, received: ${value}`)
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : 6697
  if (!parsed.hostname || Number.isNaN(port)) {
    throw new Error(`Invalid ircs URL: ${value}`)
  }

  return {
    host: parsed.hostname,
    port,
  }
}
