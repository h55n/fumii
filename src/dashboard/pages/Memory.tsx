import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Episode } from '../../memory/types'
import { MemoryCard } from '../components/MemoryCard'

export function Memory() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadEpisodes()
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [])

  const loadEpisodes = async () => {
    setLoading(true)
    try {
      const data = await window.fumiiAPI.memory.getEpisodes(50)
      setEpisodes(data || [])
    } catch {}
    setLoading(false)
  }

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) {
      loadEpisodes()
      return
    }
    // Debounce search queries — 300ms delay prevents excessive IPC/SQLite calls
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await window.fumiiAPI.memory.searchEpisodes(q)
        setEpisodes(data || [])
      } catch {}
    }, 300)
  }, [])

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: 'var(--color-text-primary)',
        margin: '0 0 6px'
      }}>memory</h1>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--color-text-secondary)',
        margin: '0 0 28px'
      }}>everything fumii remembers from your conversations</p>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="search by keyword..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            padding: '11px 16px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 180ms, box-shadow 180ms'
          }}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div style={{
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          textAlign: 'center',
          padding: '40px 0',
          fontSize: 14
        }}>loading...</div>
      ) : episodes.length === 0 ? (
        <div className="card" style={{
          padding: 36,
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.8
        }}>
          {query ? `no memories found for "${query}"` : 'no memories yet — start talking to fumii'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {episodes.map((ep, i) => (
            <div
              key={ep.id}
              style={{
                animation: `slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms forwards`,
                opacity: 0
              }}
            >
              <MemoryCard episode={ep} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
