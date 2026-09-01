const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// Add deleteAccount function to context
const importsRegex = /import \{\s*User,/;
code = code.replace(importsRegex, `import {
  User,
  deleteUser,
  linkWithPopup,
  unlink,
  EmailAuthProvider,
  GoogleAuthProvider`);

// Interface update
const interfaceRegex = /updateProfilePhoto: \(photoURL: string\) => Promise<void>;/;
code = code.replace(interfaceRegex, `updateProfilePhoto: (photoURL: string) => Promise<void>;
  deleteAccount: (confirmText: string) => Promise<void>;
  linkProvider: (providerId: string) => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  updatePrivacy: (isPublic: boolean) => Promise<void>;`);

// Implementation
const signOutRegex = /const signOut = async \(\) => \{/;
const newMethods = `const deleteAccount = async (confirmText: string) => {
    if (confirmText !== 'DELETE') throw new Error('Confirmation text did not match');
    if (!auth.currentUser) throw new Error('Not logged in');
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      setUser(null);
      setProfile(null);
    } catch (err) {
      throw err;
    }
  };

  const linkProvider = async (providerId: string) => {
    if (!auth.currentUser) return;
    try {
      const provider = providerId === 'google.com' ? googleProvider : new OAuthProvider(providerId);
      await linkWithPopup(auth.currentUser, provider);
    } catch (err) {
      throw err;
    }
  };

  const unlinkProvider = async (providerId: string) => {
    if (!auth.currentUser) return;
    try {
      await unlink(auth.currentUser, providerId);
    } catch (err) {
      throw err;
    }
  };

  const updatePrivacy = async (isPublic: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { isPublic });
      if (profile) setProfile({ ...profile, isPublic });
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {`;
  
code = code.replace(signOutRegex, newMethods);

// Add to context provider value
const contextValueRegex = /updateProfilePhoto,/;
code = code.replace(contextValueRegex, `updateProfilePhoto,
        deleteAccount,
        linkProvider,
        unlinkProvider,
        updatePrivacy,`);

fs.writeFileSync('src/context/AuthContext.tsx', code);
