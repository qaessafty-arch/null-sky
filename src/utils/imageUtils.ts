/**
 * Image processing utilities for Chesskys profile pictures
 */

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'peshmerga' | 'royal' | 'mystic' | 'grandmaster';
  url: string;
  badge: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'kurdish_sun_crest',
    name: '21-Ray Sun of Glory',
    category: 'peshmerga',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=250&auto=format&fit=crop&q=80',
    badge: '☀️'
  },
  {
    id: 'erbil_citadel_eagle',
    name: 'Citadel Golden Eagle',
    category: 'peshmerga',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    badge: '🦅'
  },
  {
    id: 'zagros_lion',
    name: 'Lion of Zagros',
    category: 'peshmerga',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
    badge: '🦁'
  },
  {
    id: 'peshmerga_commander',
    name: 'Peshmerga Commander',
    category: 'peshmerga',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    badge: '🌿'
  },
  {
    id: 'desert_tactician',
    name: 'Red Jamadani Scout',
    category: 'peshmerga',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
    badge: '🗡️'
  },
  {
    id: 'celestial_butterfly',
    name: 'Celestial Azure Sky',
    category: 'mystic',
    url: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=250&auto=format&fit=crop&q=80',
    badge: '🦋'
  },
  {
    id: 'sovereign_gold_king',
    name: '24k Gold Sovereign',
    category: 'royal',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250&auto=format&fit=crop&q=80',
    badge: '👑'
  },
  {
    id: 'citadel_diamond_queen',
    name: 'Diamond Mastermind',
    category: 'grandmaster',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    badge: '💎'
  },
  {
    id: 'mountain_knight_bronze',
    name: 'Bronze Fortress Rook',
    category: 'grandmaster',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=250&auto=format&fit=crop&q=80',
    badge: '🛡️'
  }
];

/**
 * Resizes and compresses an uploaded image file into a base64 Data URL.
 * Keeps output small (<40KB) for seamless Firestore storage and fast loading.
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic file type check
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (PNG, JPG, WEBP, GIF).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain square or aspect ratio bounded by max dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp if supported, else jpeg/png
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}
