const fs = require('fs');
let code = fs.readFileSync('src/components/ChessBoard.tsx', 'utf8');

const watermarkComponent = `
// Peshmerga Royal Board Watermark
const PeshmergaBoardWatermark: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
      <div className="w-[85%] h-[85%] opacity-35 transition-opacity duration-500 drop-shadow-[0_0_35px_rgba(245,196,83,0.45)] flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src="https://i.pinimg.com/originals/57/08/bb/5708bbf5c87fcc41897a809d11e96064.jpg"
            alt="Peshmerga Royal Kurdistan"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain mix-blend-multiply filter contrast-125 brightness-90 drop-shadow-[0_0_20px_rgba(245,196,83,0.3)]"
            onError={() => setImgFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
};
`;

code = code.replace(
  'const BatmanBoardWatermark: React.FC = () => {',
  watermarkComponent + '\nconst BatmanBoardWatermark: React.FC = () => {'
);

code = code.replace(
  "const isOnePieceBoard = boardTheme === 'one-piece';",
  "const isOnePieceBoard = boardTheme === 'one-piece';\n  const isPeshmergaBoard = boardTheme === 'peshmerga';"
);

code = code.replace(
  '{isAotBoard && <AotBoardWatermark />}',
  '{isAotBoard && <AotBoardWatermark />}\n        {isPeshmergaBoard && <PeshmergaBoardWatermark />}'
);

fs.writeFileSync('src/components/ChessBoard.tsx', code);
console.log('patched ChessBoard.tsx');
