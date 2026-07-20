import type { Conversation } from '@/types'
import { conversationRoomId, sortConversationThreads } from '@/lib/chatInbox'

const STORAGE_KEY = 'kraftigo-chat-thread-prefs-v1'

type PrefsMap = Record<string, string>

function readPrefs(): PrefsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as PrefsMap
  } catch {
    return {}
  }
}

function writePrefs(prefs: PrefsMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* quota / private mode */
  }
}

/** Remember which thread room the user last opened for this participant. */
export function rememberPreferredChatThread(
  participantId: string,
  thread: Pick<Conversation, 'id' | 'conversationId'>,
): void {
  const pid = participantId.trim()
  const room = conversationRoomId(thread)
  if (!pid || !room) return
  const prefs = readPrefs()
  prefs[pid] = room
  writePrefs(prefs)
}

function findThreadByRoom(threads: Conversation[], roomId: string): Conversation | undefined {
  const r = roomId.trim()
  if (!r) return undefined
  return threads.find((t) => conversationRoomId(t) === r)
}

/**
 * Pick the thread to open for a participant: last selected (if still valid),
 * otherwise the active unlocked thread, otherwise most recent.
 */
export function resolvePreferredChatThread(
  participantId: string,
  threads: Conversation[],
): Conversation {
  const sorted = sortConversationThreads(threads)
  if (sorted.length === 0) {
    throw new Error('resolvePreferredChatThread requires at least one thread')
  }
  if (sorted.length === 1) return sorted[0]!

  const prefs = readPrefs()
  const remembered = prefs[participantId.trim()]
  if (remembered) {
    const hit = findThreadByRoom(sorted, remembered)
    if (hit) return hit
  }

  return sorted[0]!
}
