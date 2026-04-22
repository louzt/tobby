import { useKeyboard } from '@opentui/react'
import React, { useState, useMemo, useRef, useEffect } from 'react'
import type { ScrollBoxRenderable } from '@opentui/core'
import Fuse from 'fuse.js'
import { ModalShell } from './ModalShell'
import { THEME } from '../../constants/theme'

export interface ListItem {
  id: string
  label: string
  sublabel?: string
  icon?: string
  fg?: string
}

interface ListModalProps {
  width: number
  height: number
  title?: string
  items: ListItem[]
  query: string
  onQueryChange: (q: string) => void
  onSelect: (item: ListItem) => void
  onCancel: () => void
  placeholder?: string
  emptyMessage?: string
  itemLayout?: 'inline' | 'stacked'
  modalWidth?: number
}

export function ListModal({
  width,
  height,
  title,
  items,
  query,
  onQueryChange,
  onSelect,
  onCancel,
  placeholder = 'Search...',
  emptyMessage = 'No results',
  itemLayout = 'inline',
  modalWidth: requestedModalWidth,
}: ListModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const scrollBoxRef = useRef<ScrollBoxRenderable | null>(null)
  const itemHeight = itemLayout === 'stacked' ? 2 : 1

  useEffect(() => {
    const box = scrollBoxRef.current
    if (!box) return
    const viewportHeight = box.height ?? 0
    const viewportItems = Math.max(1, Math.floor(viewportHeight / itemHeight))
    const firstVisibleItem = Math.floor(box.scrollTop / itemHeight)

    if (selectedIndex < firstVisibleItem) {
      box.scrollTop = selectedIndex * itemHeight
    } else if (selectedIndex >= firstVisibleItem + viewportItems) {
      box.scrollTop = (selectedIndex - viewportItems + 1) * itemHeight
    }
  }, [itemHeight, selectedIndex])

  const modalWidth = Math.min(requestedModalWidth ?? 60, width - 4)
  const modalHeight = Math.min(20, height - 4)

  const fuse = useMemo(
    () => new Fuse(items, { keys: ['label', 'sublabel'], threshold: 0.4 }),
    [items]
  )

  const filteredItems = useMemo(() => {
    if (!query) return items
    return fuse.search(query).map((r) => r.item)
  }, [query, items, fuse])

  const visibleItems = filteredItems.slice(
    0,
    Math.max(1, Math.floor((modalHeight - 5) / itemHeight))
  )

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return `${text.slice(0, Math.max(0, maxLength - 1))}…`
  }

  useKeyboard((key) => {
    if (key.name === 'escape') {
      onCancel()
      return
    }

    if (key.name === 'tab') {
      if (key.shift) {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      } else {
        setSelectedIndex((prev) => Math.min(visibleItems.length - 1, prev + 1))
      }
      return
    }

    if (key.name === 'up') {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
      return
    }

    if (key.name === 'down') {
      setSelectedIndex((prev) => Math.min(visibleItems.length - 1, prev + 1))
      return
    }

    if (key.name === 'return') {
      const item = visibleItems[selectedIndex]
      if (item) {
        onSelect(item)
      }
      return
    }

    if (key.name === 'backspace') {
      onQueryChange(query.slice(0, -1))
      setSelectedIndex(0)
      return
    }

    if (key.name === 'delete') {
      onQueryChange('')
      setSelectedIndex(0)
      return
    }

    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      onQueryChange(query + key.sequence)
      setSelectedIndex(0)
    }
  })

  const footer = (
    <box
      paddingLeft={2}
      paddingRight={2}
      height={1}
      backgroundColor={THEME.backgroundElement}
      justifyContent="space-between"
      flexDirection="row"
    >
      <text fg={THEME.mutedText}>
        <span fg={THEME.accent}>↑↓</span> Navigate <span fg={THEME.accent}>Enter</span> Select
      </text>
      <text fg={THEME.mutedText}>
        <span fg={THEME.accent}>Esc</span> Close
      </text>
    </box>
  )

  return (
    <ModalShell
      width={width}
      height={height}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
      title={title}
      footer={footer}
    >
      <box
        paddingLeft={2}
        paddingRight={2}
        height={2}
        paddingTop={1}
        backgroundColor={THEME.backgroundElement}
      >
        <text fg={THEME.foreground}>
          <span fg={THEME.accent}>{query ? '' : placeholder}</span>
          {query}
          <span fg={THEME.accent}>█</span>
        </text>
      </box>

      <scrollbox
        ref={scrollBoxRef as React.RefObject<ScrollBoxRenderable>}
        focused
        height={modalHeight - 5}
      >
        {visibleItems.length === 0 ? (
          <box paddingLeft={2} paddingTop={1}>
            <text fg={THEME.mutedText}>{emptyMessage}</text>
          </box>
        ) : (
          visibleItems.map((item, index) => (
            <box
              key={item.id}
              paddingLeft={2}
              paddingRight={2}
              height={itemHeight}
              backgroundColor={index === selectedIndex ? THEME.selectedBackground : undefined}
              onMouseDown={() => onSelect(item)}
            >
              {itemLayout === 'stacked' ? (
                <box flexDirection="column">
                  <box flexDirection="row" gap={1}>
                    {item.icon && <text fg={THEME.mutedText}>{item.icon}</text>}
                    <text
                      fg={item.fg ?? (index === selectedIndex ? THEME.accent : THEME.foreground)}
                    >
                      {truncateText(item.label, modalWidth - 6)}
                    </text>
                  </box>
                  <text fg={THEME.mutedText}>
                    {truncateText(item.sublabel ?? '', modalWidth - 6)}
                  </text>
                </box>
              ) : (
                <box flexDirection="row" gap={1}>
                  {item.icon && <text fg={THEME.mutedText}>{item.icon}</text>}
                  <text fg={item.fg ?? (index === selectedIndex ? THEME.accent : THEME.foreground)}>
                    {item.label}
                  </text>
                  {item.sublabel && <text fg={THEME.mutedText}>{item.sublabel}</text>}
                </box>
              )}
            </box>
          ))
        )}
      </scrollbox>
    </ModalShell>
  )
}
