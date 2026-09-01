const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
if (!rules.includes('/system_configs/')) {
  const patch = `
    match /system_configs/{configId} {
      allow read: if true;
      allow write: if isDeveloper();
    }
`;
  rules = rules.replace('match /system_health/{docId} {', patch + '    match /system_health/{docId} {');
  fs.writeFileSync('firestore.rules', rules);
}
