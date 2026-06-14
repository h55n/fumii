import { getCoreIdentity } from './MemoryStore'
import type { CoreIdentity } from './types'

/**
 * Build the ~500-token core identity block that always appears in the system prompt.
 */
export function buildCoreIdentityBlock(): string {
  const identity = getCoreIdentity()
  if (!identity || !identity.name) {
    return 'New user — no profile saved yet. Learn their name naturally through conversation.'
  }

  const lines: string[] = []
  lines.push(`Name: ${identity.name}`)

  if (identity.age_hint) {
    lines.push(`Age context: ${identity.age_hint}`)
  }

  if (identity.mood_baseline) {
    lines.push(`Baseline mood pattern: ${identity.mood_baseline}`)
  }

  try {
    const ctx = JSON.parse(identity.key_context || '{}')
    if (Array.isArray(ctx.projects) && ctx.projects.length > 0) {
      lines.push(`Current projects / things on their plate: ${ctx.projects.join(', ')}`)
    }
    if (Array.isArray(ctx.people) && ctx.people.length > 0) {
      lines.push(`Key people in their life: ${ctx.people.join(', ')}`)
    }
    if (ctx.notes) {
      lines.push(`Other context: ${ctx.notes}`)
    }
  } catch {
    // malformed JSON — skip
  }

  return lines.join('\n')
}

/**
 * Extract and persist identity information inferred from conversation.
 * Called after first few turns to seed the profile without requiring explicit setup.
 */
export function extractIdentityHints(
  current: CoreIdentity | null,
  userMessage: string
): Partial<CoreIdentity> | null {
  const updates: Partial<CoreIdentity> = {}
  let hasUpdates = false

  // Simple name extraction — "my name is X" / "I'm X" / "call me X"
  if (!current?.name) {
    const nameMatch = userMessage.match(
      /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]{1,20})/i
    )
    if (nameMatch) {
      updates.name = nameMatch[1]
      hasUpdates = true
    }
  }

  return hasUpdates ? updates : null
}
