import type { Conversation } from "@/types";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function looksLikeEmail(s: string): boolean {
  const t = s.trim();
  if (!t.includes("@")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(t);
}

/** When the API only exposes an email-like "name", choose a sensible label from role hints (tasker list = customers). */
function inferParticipantFallbackWhenEmailLike(o: Record<string, unknown>): string {
  const roleParts: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string") roleParts.push(v.toLowerCase());
    else if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && roleParts.push(x.toLowerCase()));
  };
  push(o.role);
  push(o.userRole);
  push(o.type);
  push(o.participantType);
  push(o.participant_type);
  push(o.roles);
  const blob = roleParts.join(" ");
  if (
    blob.includes("artisan") ||
    blob.includes("krafter") ||
    blob.includes("tasker") ||
    blob.includes("provider")
  ) {
    return "Krafter";
  }
  if (blob.includes("customer") || blob.includes("client")) {
    return "Customer";
  }
  return "Customer";
}

/**
 * Prefer human-readable names; many APIs put the login email in `name`, which we should not show as the thread title.
 */
export function pickParticipantDisplayName(o: Record<string, unknown>, whenEmailLike = "Customer"): string {
  const rawCandidates: unknown[] = [
    o.displayName,
    o.display_name,
    o.fullName,
    o.full_name,
    o.preferredName,
    o.preferred_name,
    [o.firstName, o.lastName].filter(Boolean).join(" "),
    [o.first_name, o.last_name].filter(Boolean).join(" "),
    o.name,
    o.username,
    o.nickname,
  ];
  for (const raw of rawCandidates) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s && !looksLikeEmail(s)) return s;
  }
  return whenEmailLike;
}

/** True when the payload explicitly indicates chat presence (not account “active” / generic flags). */
export function readParticipantOnline(src: Record<string, unknown>): boolean {
  const truthy = (v: unknown): boolean =>
    v === true || v === 1 || v === "1" || v === "true" || v === "TRUE" || v === "yes" || v === "Yes";

  /** Do not use `is_active`, `connected`, `online` alone, etc. — those often mean account state, not “in chat now”. */
  const explicitPresenceBoolKeys = [
    "isOnline",
    "is_online",
    "userIsOnline",
    "user_is_online",
    "otherUserOnline",
    "other_user_online",
    "otherParticipantOnline",
    "other_participant_online",
    "participantOnline",
    "participant_online",
    "peerOnline",
    "peer_online",
    "isPeerOnline",
    "is_peer_online",
    "isOtherUserOnline",
    "is_other_user_online",
  ];
  for (const k of explicitPresenceBoolKeys) {
    if (truthy(src[k])) return true;
  }

  const stringOnline = (s: string) => {
    const t = s.trim().toLowerCase();
    return t === "online" || t === "available" || t === "here" || t === "connected";
  };
  const stringOffline = (s: string) => {
    const t = s.trim().toLowerCase();
    return t === "offline" || t === "away" || t === "busy" || t === "inactive" || t === "disconnected";
  };

  for (const k of [
    "onlineStatus",
    "online_status",
    "presence",
    "chatPresence",
    "chat_presence",
    "userStatus",
    "user_status",
    "availability",
  ]) {
    const raw = src[k];
    if (typeof raw !== "string") continue;
    if (stringOnline(raw)) return true;
    if (stringOffline(raw)) return false;
  }

  const st = typeof src.status === "string" ? src.status.trim().toLowerCase() : "";
  if (st === "online" || st === "available" || st === "connected") return true;
  if (st === "offline" || st === "away" || st === "busy" || st === "inactive") return false;

  const nestedKeys = ["user", "profile", "account", "participantUser", "participant_user"];
  for (const nk of nestedKeys) {
    const nested = src[nk];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    const nr = asRecord(nested);
    for (const k of ["isOnline", "is_online", "userIsOnline", "user_is_online"]) {
      if (truthy(nr[k])) return true;
    }
    for (const k of [
      "onlineStatus",
      "online_status",
      "presence",
      "userStatus",
      "user_status",
      "availability",
    ]) {
      const raw = nr[k];
      if (typeof raw === "string" && stringOnline(raw)) return true;
      if (typeof raw === "string" && stringOffline(raw)) return false;
    }
  }

  return false;
}

function enrichOtherParticipantOnlineFromRow(conv: Conversation, row: unknown): Conversation {
  const op = conv.otherParticipant;
  if (!op) return conv;
  const rowRec = asRecord(row);
  const opRec = asRecord(op as unknown as Record<string, unknown>);
  /** Prefer signals on the merged object (participant + conversation-level flags share one read). */
  const mergedSignals = { ...rowRec, ...opRec };
  const online =
    readParticipantOnline(mergedSignals) || readParticipantOnline(opRec) || readParticipantOnline(rowRec);
  return { ...conv, otherParticipant: { ...op, isOnline: online } };
}

export function parseConversationPayload(
  data: unknown,
  fallback: { otherUserId: string; displayName: string; displayAvatar?: string },
): Conversation | null {
  const root = asRecord(data);
  if (!Object.keys(root).length) return null;

  const bag =
    root.conversation && typeof root.conversation === "object" && !Array.isArray(root.conversation)
      ? asRecord(root.conversation)
      : root.data && typeof root.data === "object" && !Array.isArray(root.data)
        ? asRecord(root.data)
        : root;

  const roomId = String(
    bag.id ?? bag.conversationId ?? root.id ?? root.conversationId ?? "",
  ).trim();
  if (!roomId) return null;

  const rawOp = bag.otherParticipant ?? bag.other_participant ?? bag.participant;
  let other: Conversation["otherParticipant"];
  if (rawOp && typeof rawOp === "object" && !Array.isArray(rawOp)) {
    const o = asRecord(rawOp);
    const oid = String(o.id ?? o.userId ?? "").trim();
    const oname = pickParticipantDisplayName(
      o,
      fallback.displayName?.trim() || inferParticipantFallbackWhenEmailLike(o),
    );
    const oavatar =
      (typeof o.avatar === "string" && o.avatar) ||
      (typeof o.profilePhotoUrl === "string" && o.profilePhotoUrl) ||
      undefined;
    const online = readParticipantOnline({ ...bag, ...o });
    if (oid && oname) other = { id: oid, name: oname, avatar: oavatar, isOnline: online };
  }

  if (!other) {
    other = {
      id: fallback.otherUserId,
      name: fallback.displayName,
      avatar: fallback.displayAvatar,
      isOnline: false,
    };
  }

  const unreadRaw = bag.unreadCount ?? bag.unread_count;
  const unreadCount = typeof unreadRaw === "number" && Number.isFinite(unreadRaw) ? unreadRaw : 0;

  const contextType = String(bag.contextType ?? bag.context_type ?? "").trim() || undefined;
  const contextId = String(bag.contextId ?? bag.context_id ?? "").trim() || undefined;
  const jobTitle =
    (typeof bag.jobTitle === "string" && bag.jobTitle.trim()) ||
    (typeof bag.job_title === "string" && bag.job_title.trim()) ||
    undefined;
  const bookingTitle =
    (typeof bag.bookingTitle === "string" && bag.bookingTitle.trim()) ||
    (typeof bag.booking_title === "string" && bag.booking_title.trim()) ||
    undefined;
  const contextLabel =
    (typeof bag.contextLabel === "string" && bag.contextLabel.trim()) ||
    (typeof bag.context_label === "string" && bag.context_label.trim()) ||
    undefined;

  const bookingNested =
    bag.booking && typeof bag.booking === "object" && !Array.isArray(bag.booking)
      ? asRecord(bag.booking)
      : null;
  const nestedJobTitle =
    bookingNested &&
    (typeof bookingNested.jobTitle === "string"
      ? bookingNested.jobTitle.trim()
      : typeof bookingNested.job_title === "string"
        ? bookingNested.job_title.trim()
        : "");

  return {
    id: roomId,
    conversationId: roomId,
    otherParticipant: other,
    isLocked: Boolean(bag.isLocked ?? bag.is_locked),
    unreadCount,
    lastMessage:
      (typeof bag.lastMessage === "string" && bag.lastMessage) ||
      (typeof bag.last_message === "string" && bag.last_message) ||
      undefined,
    lastMessageAt: bag.lastMessageAt ?? bag.last_message_at ?? bag.updatedAt ?? bag.updated_at,
    contextType,
    contextId,
    jobTitle: (jobTitle ?? nestedJobTitle) || undefined,
    bookingTitle,
    contextLabel,
    createdAt:
      (typeof bag.createdAt === "string" && bag.createdAt) ||
      (typeof bag.created_at === "string" && bag.created_at) ||
      undefined,
    updatedAt:
      (typeof bag.updatedAt === "string" && bag.updatedAt) ||
      (typeof bag.updated_at === "string" && bag.updated_at) ||
      undefined,
  };
}

/** Last resort when list rows were not fully parsed but `otherParticipant.name` is still an email. */
export function scrubConversationOtherParticipantEmail(
  conv: Conversation,
  replaceEmailNameWith = "Customer",
): Conversation {
  const op = conv.otherParticipant;
  const n = op?.name?.trim() ?? "";
  if (!op || !n || !looksLikeEmail(n)) return conv;
  return { ...conv, otherParticipant: { ...op, name: replaceEmailNameWith } };
}

/** Merge API list/detail payloads with parsed ids/names so we keep `lastMessage` etc. but fix email-as-name. */
export function normalizeConversationListItem(
  row: unknown,
  fallback: { otherUserId: string; displayName: string; displayAvatar?: string } = {
    otherUserId: "",
    displayName: "",
  },
): Conversation | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const base = row as Conversation;
  const parsed = parseConversationPayload(row, fallback);
  const merged: Conversation = parsed
    ? {
        ...base,
        ...parsed,
        otherParticipant: (() => {
          const p = parsed.otherParticipant;
          const b = base.otherParticipant;
          if (p && b) return { ...b, ...p };
          return p ?? b;
        })(),
      }
    : base;
  return scrubConversationOtherParticipantEmail(enrichOtherParticipantOnlineFromRow(merged, row));
}
