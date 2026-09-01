const fs = require('fs');
let code = fs.readFileSync('src/components/FriendChatModal.tsx', 'utf8');

const replacement = `
        {/* Quick Taunt / Emote / Sticker Bar */}
        <div className="py-2 border-t border-white/10 shrink-0">
          <div className="flex gap-3 mb-2 px-1">
            <button
              type="button"
              onClick={() => setShowStickers(false)}
              className={\`text-[10px] font-bold uppercase tracking-wider transition-colors \${!showStickers ? 'text-[#F5C453]' : 'text-[#DFD0B0]/40 hover:text-[#DFD0B0]/60'}\`}
            >
              Text Reactions
            </button>
            <button
              type="button"
              onClick={() => setShowStickers(true)}
              className={\`text-[10px] font-bold uppercase tracking-wider transition-colors \${showStickers ? 'text-[#F5C453]' : 'text-[#DFD0B0]/40 hover:text-[#DFD0B0]/60'}\`}
            >
              Stickers
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-h-[44px]">
            {showStickers ? (
              stickers.length > 0 ? (
                stickers.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(\`<img src="\${url}" alt="sticker" class="w-16 h-16 object-contain inline-block" />\`)}
                    className="min-h-[44px] min-w-[44px] p-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center"
                  >
                    <img src={url} alt="Sticker" className="w-8 h-8 object-contain" />
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-white/40 px-2">No stickers available</span>
              )
            ) : (
              QUICK_EMOTES.map((emote, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(emote)}
                  className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-white/5 shrink-0"
                >
                  {emote}
                </button>
              ))
            )}
          </div>
        </div>
`;

code = code.replace(/\{\/\* Quick Taunt \/ Emote Bar \*\/\}.*?<\/div>/s, replacement.trim());
fs.writeFileSync('src/components/FriendChatModal.tsx', code);
