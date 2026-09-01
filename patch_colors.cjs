const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

// Primary button style
// Link buttons are not primary, but we can make them primary if they are selected. 
// "Destructive buttons: bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
// I used `bg-red-600 hover:bg-red-700 text-white` for Confirm Delete.

// "Inputs: bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] rounded-xl px-4 py-3 text-white placeholder-slate-500"
// I used bg-black/60 border border-red-500/30 for the delete input.
code = code.replace(
  'className="w-full px-3 py-2 bg-black/60 border border-red-500/30 rounded-lg text-xs text-white"',
  'className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] rounded-xl text-xs text-white placeholder-slate-500"'
);

// Destructive buttons: bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl
code = code.replace(
  'className="w-full py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 font-bold text-xs transition-colors"',
  'className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"'
);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
