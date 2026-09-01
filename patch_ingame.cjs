const fs = require('fs');
let code = fs.readFileSync('src/components/InGameChatDrawer.tsx', 'utf8');

const replacement = `
      {/* Quick Emote Presets Tray */}
      <div className="p-3 bg-black/60 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
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
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar min-h-[44px]">
          {showStickers ? (
            stickers.length > 0 ? (
              stickers.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickEmote(\`<img src="\${url}" alt="sticker" class="w-16 h-16 object-contain inline-block" />\`)}
                  className="min-h-[44px] min-w-[44px] p-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center"
                >
                  <img src={url} alt="Sticker" className="w-8 h-8 object-contain" />
                </button>
              ))
            ) : (
              <span className="text-[10px] text-white/40">No stickers available</span>
            )
          ) : (
            QUICK_EMOTES.map((emote, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickEmote(emote)}
                className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white text-xs font-bold whitespace-nowrap border border-white/10 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {emote}
              </button>
            ))
          )}
        </div>
`;

code = code.replace(/\{\/\* Quick Emote Presets Tray \*\/\}.*?<\/button>\s*\)\)\}\s*<\/div>/s, replacement.trim());
fs.writeFileSync('src/components/InGameChatDrawer.tsx', code);
