const fs = require('fs');
let code = fs.readFileSync('src/services/friendService.ts', 'utf8');

const sendReqMatch = /const existing = await getDocs\(q\);/;
code = code.replace(sendReqMatch, (match) => {
  return `
    // Check if blocked by target
    const targetBlockRef = doc(db, \`users/\${targetUser.uid}/blocked/\${currentUser.uid}\`);
    const targetBlockSnap = await getDoc(targetBlockRef);
    if (targetBlockSnap.exists()) {
      return { success: false, message: 'You cannot send a friend request to this user.' };
    }
    
    // Check if we blocked target
    const myBlockRef = doc(db, \`users/\${currentUser.uid}/blocked/\${targetUser.uid}\`);
    const myBlockSnap = await getDoc(myBlockRef);
    if (myBlockSnap.exists()) {
      return { success: false, message: 'You have blocked this user. Unblock them first.' };
    }
` + match;
});

fs.writeFileSync('src/services/friendService.ts', code);
