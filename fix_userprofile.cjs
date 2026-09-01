const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfilePage.tsx', 'utf8');

code = code.replace(/import \{ Lock, PanelContainer \} from '\.\/PanelContainer';/, "import { PanelContainer } from './PanelContainer';");

if (!code.includes('Lock,')) {
  code = code.replace(/import \{ /, "import { Lock, ");
}

fs.writeFileSync('src/components/UserProfilePage.tsx', code);
