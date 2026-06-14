import React from 'react'
import { Transcript } from '../../memory/types'

interface TranscriptViewProps {
  transcripts: Transcript[]
}

export function TranscriptView({ transcripts }: TranscriptViewProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxHeight: 400,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '#22223A transparent'
    }}>
      {transcripts.map(tx => (
        <div
          key={tx.id}
          style={{
            alignSelf: tx.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%'
          }}
        >
          {tx.role === 'user' ? (
            <div style={{
              background: '#22223A',
              color: '#EEEAE0',
              borderRadius: '14px 14px 4px 14px',
              padding: '8px 12px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 13,
              lineHeight: 1.5
            }}>{tx.content}</div>
          ) : (
            <div style={{
              color: '#F5A623',
              borderLeft: '2px solid rgba(245,166,35,0.5)',
              padding: '6px 12px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 13,
              lineHeight: 1.65
            }}>{tx.content}</div>
          )}
        </div>
      ))}
    </div>
  )
}
