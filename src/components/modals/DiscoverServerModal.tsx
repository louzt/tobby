import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../store'
import { ListModal, type ListItem } from './ListModal'
import {
  fetchDiscoverServers,
  toDiscoverServerPrefill,
  type DiscoverServerEntry,
} from '../../utils/discoverServers'

interface DiscoverServerModalProps {
  width: number
  height: number
}

export function DiscoverServerModal({ width, height }: DiscoverServerModalProps) {
  const openModal = useStore((state) => state.openModal)
  const closeModal = useStore((state) => state.closeModal)
  const setDiscoverServerPrefill = useStore((state) => state.setDiscoverServerPrefill)
  const [query, setQuery] = useState('')
  const [servers, setServers] = useState<DiscoverServerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadServers = async () => {
      try {
        const nextServers = await fetchDiscoverServers()
        if (cancelled) return
        setServers(nextServers)
        setError(null)
      } catch (loadError) {
        if (cancelled) return
        setServers([])
        setError(loadError instanceof Error ? loadError.message : 'Failed to load discover servers')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadServers()

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo<ListItem[]>(() => {
    return servers.map((server) => ({
      id: server.id,
      label: server.name,
      sublabel: `${server.host}:${server.port}${server.description ? ` — ${server.description}` : ''}`,
      fg: server.obsidian ? 'cyan' : undefined,
    }))
  }, [servers])

  const emptyMessage = loading
    ? 'Loading public IRC servers...'
    : (error ?? 'No public servers found')

  const handleSelect = (item: ListItem) => {
    const server = servers.find((entry) => entry.id === item.id)
    if (!server) return

    setDiscoverServerPrefill(toDiscoverServerPrefill(server))
    openModal('connect')
  }

  return (
    <ListModal
      width={width}
      height={height}
      modalWidth={76}
      title="Browse Public Servers"
      items={items}
      query={query}
      onQueryChange={setQuery}
      onSelect={handleSelect}
      onCancel={closeModal}
      itemLayout="stacked"
      placeholder="Search public IRC servers..."
      emptyMessage={emptyMessage}
    />
  )
}
