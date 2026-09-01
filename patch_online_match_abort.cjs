const fs = require('fs');
let code = fs.readFileSync('src/components/OnlineMatchView.tsx', 'utf8');

// The match document contains moves array.
// If session.moves.length < 2, show Abort button instead of Resign? Or next to Resign?
// Let's replace the Resign button with Abort if moves.length < 2.
// Actually, let's keep both or replace Resign with Abort. Let's just add Abort button.

const buttonSection = /<button\s+onClick=\{handleResign\}\s+className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-red-500\/10 text-red-400 hover:bg-red-500\/20 border border-red-500\/30 transition-colors"\s+>/;

const abortButton = `
              {session.moves && session.moves.length < 2 && (
                <button
                  onClick={() => socket.emit('abort_match', { matchId, uid: currentUid })}
                  className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/30 transition-colors"
                >
                  <X className="w-5 h-5 mb-1" />
                  <span>Abort</span>
                </button>
              )}
`;

code = code.replace(buttonSection, (match) => abortButton + match);

if (!code.includes("import {") || !code.includes("X,")) {
  code = code.replace(/import \{ /, "import { X, ");
}

fs.writeFileSync('src/components/OnlineMatchView.tsx', code);
