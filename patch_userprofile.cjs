const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfilePage.tsx', 'utf8');

const privacyCheck = `
  if (profile && profile.isPublic === false && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Lock className="w-12 h-12 text-[#DFD0B0]/40 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Private Profile</h2>
        <p className="text-sm text-[#DFD0B0]/60 max-w-sm">This profile is private and cannot be viewed.</p>
      </div>
    );
  }
`;

code = code.replace(/const displayName = profile\?\.displayName \|\| user\?\.displayName \|\| 'Grandmaster Qays';/, (match) => privacyCheck + match);

// We need to import Lock
code = code.replace(/import \{ /, "import { Lock, ");

fs.writeFileSync('src/components/UserProfilePage.tsx', code);
