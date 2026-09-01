const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const isPeshmergaThemeCode = `
  const isPeshmergaTheme = 
    settings.boardTheme === 'peshmerga';
`;

code = code.replace(
  "const isBatmanTheme =",
  isPeshmergaThemeCode.trim() + "\n  const isBatmanTheme ="
);

const peshmergaBgCode = `
      {/* Peshmerga Wallpaper Background */}
      {isPeshmergaTheme && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{
            backgroundImage: \`url('https://i.pinimg.com/originals/57/08/bb/5708bbf5c87fcc41897a809d11e96064.jpg')\`,
            opacity: 0.15,
            filter: 'brightness(0.6) contrast(1.3) saturate(1.2)'
          }}
        />
      )}
`;

code = code.replace(
  "{/* Batman Gotham Bat-Symbol Cinematic Wallpaper Background */}",
  peshmergaBgCode.trim() + "\n\n      {/* Batman Gotham Bat-Symbol Cinematic Wallpaper Background */}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx');
