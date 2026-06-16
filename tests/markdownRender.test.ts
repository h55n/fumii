import { describe, it, expect } from 'vitest'
import { marked } from 'marked'

// Test the exact marked configuration used in ChatBubble.tsx
describe('marked rendering', () => {
  it('renders markdown synchronously when async is false', () => {
    marked.setOptions({ breaks: true, gfm: true, async: false })
    
    const result = marked.parse('**Bold** and *italic*')
    
    // The issue was that without async: false, marked.parse() returned a Promise.
    // We expect a string here.
    expect(typeof result).toBe('string')
    expect(result).toContain('<strong>Bold</strong>')
    expect(result).toContain('<em>italic</em>')
  })
})
