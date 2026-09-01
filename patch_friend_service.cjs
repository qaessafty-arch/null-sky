const fs = require('fs');
let code = fs.readFileSync('src/services/friendService.ts', 'utf8');

// 1. Add rate limiting to sendFriendRequest
const sendReqMatch = /export const sendFriendRequest = async \([^)]+\): Promise<\{ success: boolean; message: string \}> => \{/;
code = code.replace(sendReqMatch, (match) => {
  return match + `
  try {
    const rateLimitRes = await fetch('/api/friends/rate-limit-check', { method: 'POST' });
    if (!rateLimitRes.ok) {
      if (rateLimitRes.status === 429) {
        return { success: false, message: 'Too many friend requests sent. Please wait.' };
      }
    }
  } catch(e) {
    console.warn('Rate limit check failed', e);
  }
`;
});

// 2. Update searchUsersInDirectory for prefix match
// Currently it fetches limit(25) and filters. We'll change it to fetch all or do a query, but since it asks for case-insensitive, we can just fetch limit(50) and filter in memory, OR we can just use the standard Firestore range query if we assume the first letter case matches, OR since we don't have a lowercase field, client side filtering on a larger set might be the only way without schema changes. Let's just fetch all users if collection is small, or limit 100.
// Let's modify searchUsersInDirectory to make it a bit more "live".
// Actually, I'll leave the search if it's already implemented with in-memory filtering. "results appear live from Firestore query". Maybe I should do a real Firestore query using \`>= name\` and \`<= name + '\\uf8ff'\`.
// Let's check if there's any other way. I will add a proper prefix query for case-sensitive, and also fetch lowercase matches if we can. I will just do it properly.

fs.writeFileSync('src/services/friendService.ts', code);
