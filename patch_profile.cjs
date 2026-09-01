const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

// Add states for account management
const stateRegex = /const \[ownerBadgeSuccess, setOwnerBadgeSuccess\] = useState\(''\);/;
const stateInjection = `const [ownerBadgeSuccess, setOwnerBadgeSuccess] = useState('');
  
  // Account Management States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [linkError, setLinkError] = useState('');
  
  const handleTogglePrivacy = async () => {
    try {
      await useAuth().updatePrivacy(!profile?.isPublic);
    } catch (e) {
      console.error('Failed to update privacy', e);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    try {
      await useAuth().deleteAccount(deleteInput);
      onClose();
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        setDeleteError('Requires recent login. Please sign out and sign in again before deleting your account.');
      } else {
        setDeleteError(e.message || 'Failed to delete account');
      }
    }
  };

  const handleLinkProvider = async (providerId: string) => {
    setLinkError('');
    try {
      await useAuth().linkProvider(providerId);
    } catch (e: any) {
      setLinkError(e.message || 'Failed to link account');
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    setLinkError('');
    try {
      await useAuth().unlinkProvider(providerId);
    } catch (e: any) {
      setLinkError(e.message || 'Failed to unlink account');
    }
  };

  const userProviders = user?.providerData?.map(p => p.providerId) || [];
`;
code = code.replace(stateRegex, stateInjection);

// Find where to insert the new sections
const changePhotoRegex = /\{\/\* Avatar Studio Trigger \*\/\}/;

const accountManagementSection = `
              </div>

              {/* Account Management & Privacy */}
              <div className="mt-6 pt-5 border-t border-white/10 space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#DFD0B0]/70 tracking-wider mb-3">Privacy & Settings</h3>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Public Profile</div>
                      <div className="text-[10px] text-white/50">Allow others to view your profile and match history</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile?.isPublic !== false} onChange={handleTogglePrivacy} />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-[#DFD0B0]/70 tracking-wider mb-3">Linked Accounts</h3>
                  {linkError && <p className="text-[10px] text-red-400 mb-2">{linkError}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => userProviders.includes('google.com') ? handleUnlinkProvider('google.com') : handleLinkProvider('google.com')}
                      className={\`px-3 py-2 rounded-xl border text-xs font-bold transition-all \${userProviders.includes('google.com') ? 'bg-[#52673A]/20 border-[#52673A] text-emerald-300' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}\`}
                    >
                      {userProviders.includes('google.com') ? 'Unlink Google' : 'Link Google'}
                    </button>
                    <button
                      type="button"
                      onClick={() => userProviders.includes('password') ? handleUnlinkProvider('password') : handleLinkProvider('password')}
                      className={\`px-3 py-2 rounded-xl border text-xs font-bold transition-all \${userProviders.includes('password') ? 'bg-[#52673A]/20 border-[#52673A] text-emerald-300' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}\`}
                    >
                      {userProviders.includes('password') ? 'Unlink Email' : 'Link Email'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-[#DFD0B0]/70 tracking-wider mb-3">Session Info</h3>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] space-y-1.5 text-white/60">
                    <div className="flex justify-between">
                      <span>Account Created:</span>
                      <span className="text-white/90">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sign-In:</span>
                      <span className="text-white/90">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-white/5 flex justify-end">
                      <button type="button" onClick={signOut} className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                        Sign Out of All Devices
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 font-bold text-xs transition-colors"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 space-y-3">
                      <p className="text-[10px] text-red-200 font-bold">WARNING: This action is permanent. Type DELETE to confirm.</p>
                      <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-3 py-2 bg-black/60 border border-red-500/30 rounded-lg text-xs text-white"
                      />
                      {deleteError && <p className="text-[10px] text-red-400">{deleteError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deleteInput !== 'DELETE'}
                          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 text-xs font-bold transition-colors"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
`;

code = code.replace(/<button\s*type="button"\s*onClick=\{\(\) => setIsAvatarStudioOpen\(true\)\}\s*className="p-2 px-2\.5 rounded-xl bg-gradient-to-r from-amber-600\/30 to-amber-500\/20[^>]*>\s*<Wand2 className="w-3\.5 h-3\.5 text-\[#F5C453\]" \/>\s*<span className="hidden sm:inline">Avatar Studio<\/span>\s*<\/button>\s*<\/div>/, (match) => match + accountManagementSection);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
