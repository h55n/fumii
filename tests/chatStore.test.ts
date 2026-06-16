import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '../src/store/chatStore'

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages()
    useChatStore.getState().setOpen(false)
  })

  it('preserves messages correctly', () => {
    const store = useChatStore.getState()
    store.addMessage('user', 'Hello')
    
    // Chat open state should not clear messages
    store.setOpen(true)
    expect(useChatStore.getState().messages.length).toBe(1)
    
    store.setOpen(false)
    expect(useChatStore.getState().messages.length).toBe(1)
    
    store.clearMessages()
    expect(useChatStore.getState().messages.length).toBe(0)
  })

  it('filters history for LLM correctly', () => {
    const store = useChatStore.getState()
    
    // Add various message types
    store.addMessage('user', 'Hello')
    
    const streamingId = store.addMessage('assistant', '') // empty content makes it streaming = true
    store.updateMessage(streamingId, 'Streaming response...') 
    // now it has content, but streaming is still true, so it should be filtered out
    
    const emptyId = store.addMessage('assistant', '')
    store.finalizeMessage(emptyId) // empty and not streaming -> filtered out
    
    const completedId = store.addMessage('assistant', '')
    store.updateMessage(completedId, 'Completed response.')
    store.finalizeMessage(completedId) // not empty and not streaming -> kept
    
    const history = store.getHistoryForLLM()
    
    expect(history.length).toBe(2)
    expect(history[0].role).toBe('user')
    expect(history[0].content).toBe('Hello')
    expect(history[1].role).toBe('assistant')
    expect(history[1].content).toBe('Completed response.')
  })

  it('updates streaming messages properly', () => {
    const id = useChatStore.getState().addMessage('assistant', '')
    useChatStore.getState().updateMessage(id, 'Initial chunk')
    
    expect(useChatStore.getState().messages[0].content).toBe('Initial chunk')
    expect(useChatStore.getState().messages[0].streaming).toBe(true)
    
    useChatStore.getState().finalizeMessage(id)
    expect(useChatStore.getState().messages[0].streaming).toBe(false)
  })
})
