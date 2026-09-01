const fs = require('fs');
let code = fs.readFileSync('src/components/FriendChatModal.tsx', 'utf8');

const stateInjection = `const [inputText, setInputText] = useState('');
  const [stickers, setStickers] = useState<string[]>([]);
  const [showStickers, setShowStickers] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_configs', 'stickers'), (docSnap) => {
      if (docSnap.exists()) {
        setStickers(docSnap.data().urls || []);
      }
    });
    return () => unsub();
  }, []);`;

code = code.replace("const [inputText, setInputText] = useState('');", stateInjection);
fs.writeFileSync('src/components/FriendChatModal.tsx', code);
