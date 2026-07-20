import type { Conversation } from '@/types'
import { resolvePreferredChatThread } from '@/lib/chatThreadPreference'

export function conversationRoomId(conv: Pick<Conversation, 'id' | 'conversationId'>): string {
  return String(conv.conversationId ?? conv.id ?? '').trim()
}

function lastActivityMs(conv: Conversation): number {
  const raw = conv.lastMessageAt ?? conv.updatedAt ?? conv.createdAt
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Sort threads: active (unlocked) first, then most recent activity. */
export function sortConversationThreads(threads: Conversation[]): Conversation[] {
  return [...threads].sort((a, b) => {
    if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1
    return lastActivityMs(b) - lastActivityMs(a)
  })
}

export function getConversationContextLabel(conv: Conversation): string {
  const explicit =
    conv.contextLabel?.trim() ||
    conv.jobTitle?.trim() ||
    conv.bookingTitle?.trim()
  if (explicit) {
    return conv.isLocked ? `${explicit} · past Kraft` : explicit
  }

  if (conv.contextType?.toUpperCase() === 'BOOKING' && conv.contextId) {
    return conv.isLocked ? 'Past Kraft (read-only)' : 'Current Kraft'
  }

  return conv.isLocked ? 'Past conversation (read-only)' : 'Active conversation'
}

export interface ParticipantChatGroup {
  participantId: string
  participant: NonNullable<Conversation['otherParticipant']>
  threads: Conversation[]
  totalUnread: number
  /** Thread used for list preview (name row subtitle / last message). */
  previewThread: Conversation
}

export function groupConversationsByParticipant(
  conversations: Conversation[],
): ParticipantChatGroup[] {
  const byParticipant = new Map<string, Conversation[]>()

  for (const conv of conversations) {
    const pid = conv.otherParticipant?.id?.trim()
    if (!pid) continue
    const list = byParticipant.get(pid) ?? []
    list.push(conv)
    byParticipant.set(pid, list)
  }

  const groups: ParticipantChatGroup[] = []

  for (const [participantId, rawThreads] of byParticipant) {
    const threads = sortConversationThreads(rawThreads)
    const previewThread =
      threads.length > 1
        ? resolvePreferredChatThread(participantId, threads)
        : threads[0]!
    const participant = previewThread.otherParticipant
    if (!participant) continue

    groups.push({
      participantId,
      participant,
      threads,
      totalUnread: threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
      previewThread,
    })
  }

  return groups.sort(
    (a, b) => lastActivityMs(b.previewThread) - lastActivityMs(a.previewThread),
  )
}

export function findConversationForBooking(
  conversations: Conversation[],
  bookingId: string,
): Conversation | undefined {
  const bid = bookingId.trim()
  if (!bid) return undefined
  return conversations.find((c) => String(c.contextId ?? '').trim() === bid)
}

export function findActiveConversationForParticipant(
  conversations: Conversation[],
  participantId: string,
): Conversation | undefined {
  const pid = participantId.trim()
  if (!pid) return undefined
  const matches = conversations.filter((c) => c.otherParticipant?.id === pid)
  if (matches.length === 0) return undefined
  return resolvePreferredChatThread(pid, matches)
}

export function filterChatGroups(
  groups: ParticipantChatGroup[],
  query: string,
): ParticipantChatGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups

  return groups.filter((g) => {
    const name = g.participant.name?.toLowerCase() ?? ''
    const preview = g.previewThread.lastMessage?.toLowerCase() ?? ''
    const context = getConversationContextLabel(g.previewThread).toLowerCase()
    const threadMatch = g.threads.some((t) =>
      getConversationContextLabel(t).toLowerCase().includes(q),
    )
    return name.includes(q) || preview.includes(q) || context.includes(q) || threadMatch
  })
}
