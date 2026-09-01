const LOCAL_UID_KEY = 'chess_local_player_uid';

const randomGuestUid = () => `guest_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Stable identity for players who are not signed in, so online matches,
 * chat and matchmaking all recognise the same person across views/reloads.
 */
export const getLocalPlayerUid = (): string => {
  try {
    const existing = localStorage.getItem(LOCAL_UID_KEY);
    if (existing) return existing;
    const uid = randomGuestUid();
    localStorage.setItem(LOCAL_UID_KEY, uid);
    return uid;
  } catch {
    return randomGuestUid();
  }
};
