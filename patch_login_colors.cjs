const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

// The prompt specifically said:
// "UI RULES: Inputs: bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] rounded-xl px-4 py-3 text-white placeholder-slate-500."

code = code.replace(/bg-slate-950\/80 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-\[#F5C453\] focus:ring-1 focus:ring-\[#F5C453\]/g, 'bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B]');

code = code.replace(/bg-slate-950\/80 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-\[#F59E0B\] focus:ring-1 focus:ring-\[#F59E0B\]/g, 'bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-[#F59E0B]');

fs.writeFileSync('src/components/LoginPage.tsx', code);
