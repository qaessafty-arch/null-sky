const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// Update elo for new users
code = code.replace(
  "elo: isDev ? 3000 : 1200,",
  "elo: isDev ? 3000 : 800,"
);

// Add session logout to signOut
const signOutRegex = /const signOut = async \(\) => \{[\s\S]*?\};/;
const newSignOut = `const signOut = async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch (err) {
      console.warn('Session logout failed', err);
    }
    await firebaseSignOut(auth);
  };`;

code = code.replace(signOutRegex, newSignOut);

fs.writeFileSync('src/context/AuthContext.tsx', code);
