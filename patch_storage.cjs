const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

if (!code.includes('import { storage }')) {
  code = code.replace(
    /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
    "import { useAuth } from '../context/AuthContext';\nimport { storage } from '../utils/firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"
  );
}

const photoFileSelectRegex = /const handlePhotoFileSelect = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?\};/;
const newPhotoFileSelect = `const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File must be smaller than 2MB');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only .jpg, .png, and .webp images are allowed');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, \`avatars/\${user?.uid}/\${Date.now()}_\${file.name}\`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setProfilePhotoInput(downloadUrl);
      setCustomPhotoUrlInput(downloadUrl);
      await updateProfilePhoto(downloadUrl);

      setPhotoSuccessMessage('Profile picture uploaded to storage and saved successfully!');
      setTimeout(() => setPhotoSuccessMessage(''), 3500);
    } catch (err: any) {
      alert(err?.message || 'Failed to process image file');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };`;

code = code.replace(photoFileSelectRegex, newPhotoFileSelect);
fs.writeFileSync('src/components/ProfileModal.tsx', code);
