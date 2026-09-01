const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

if (!code.includes('import { sanitizeChatText }')) {
  code = code.replace(
    /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
    "import { useAuth } from '../context/AuthContext';\nimport { sanitizeChatText } from '../utils/security';"
  );
}

const handleSaveEditRegex = /const handleSaveEdit = async \(\) => \{[\s\S]*?\};/;
const newHandleSaveEdit = `const handleSaveEdit = async () => {
    let sanitizedDisplayName = sanitizeChatText(displayName.trim());
    if (sanitizedDisplayName.length > 20) sanitizedDisplayName = sanitizedDisplayName.substring(0, 20);
    const sanitizedStatus = sanitizeChatText(statusMessage.trim());

    await updateProfileDetails({
      displayName: sanitizedDisplayName,
      country: country.trim(),
      flag: flag.trim(),
      customStatus: sanitizedStatus,
      customBadge: customBadgeInput.trim() || undefined,
      badgeNumber: Number(badgeNumberInput),
      photoURL: profilePhotoInput.trim() || undefined
    });
    setIsEditing(false);
    setPhotoSuccessMessage('Profile and picture updated and saved to cloud!');
    setTimeout(() => setPhotoSuccessMessage(''), 3500);
  };`;

code = code.replace(handleSaveEditRegex, newHandleSaveEdit);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
