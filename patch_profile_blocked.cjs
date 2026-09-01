const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

// Add state for blocked users
code = code.replace(/const \[deleteError, setDeleteError\] = useState\(''\);/, 
  "const [deleteError, setDeleteError] = useState('');\n  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);\n  useEffect(() => {\n    if (user?.uid && isOpen) {\n      const unsub = onSnapshot(collection(db, \`users/\${user.uid}/blocked\`), snap => {\n        setBlockedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n      });\n      return () => unsub();\n    }\n  }, [user?.uid, isOpen]);\n  const handleUnblock = async (uid: string) => { if(user) { await deleteDoc(doc(db, \`users/\${user.uid}/blocked/\${uid}\`)); } };"
);

// We need collection, doc, onSnapshot, deleteDoc, db
if (!code.includes("import { doc, deleteDoc")) {
  code = code.replace(/import \{ useAuth \} from '\.\.\/context\/AuthContext';/, "import { useAuth } from '../context/AuthContext';\nimport { collection, doc, onSnapshot, deleteDoc } from 'firebase/firestore';\nimport { db } from '../utils/firebase';");
}

const blockedListSection = `
                <div>
                  <h3 className="text-xs font-black uppercase text-[#DFD0B0]/70 tracking-wider mb-3">Blocked Users</h3>
                  {blockedUsers.length === 0 ? (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] text-white/50 italic">
                      You haven't blocked any users.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-xs text-white/90">{b.displayName || b.uid}</span>
                          <button
                            type="button"
                            onClick={() => handleUnblock(b.id)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold transition-all"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
`;

code = code.replace(/<h3 className="text-xs font-black uppercase text-\[#DFD0B0\]\/70 tracking-wider mb-3">Session Info<\/h3>/, (match) => blockedListSection + match);

fs.writeFileSync('src/components/ProfileModal.tsx', code);
