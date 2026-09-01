const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

// Add confirmPassword state
code = code.replace(
  "const [password, setPassword] = useState('');",
  "const [password, setPassword] = useState('');\n  const [confirmPassword, setConfirmPassword] = useState('');"
);

// Update handleEmailSubmit
const handleEmailSubmitRegex = /const handleEmailSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{\s*setIsSubmitting\(false\);\s*\}\s*\};/;
const newHandleEmailSubmit = `const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (authMode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(email.trim());
        setSuccessMessage('Password reset link has been dispatched to your email.');
        setTimeout(() => {
          setAuthMode('signin');
          setSuccessMessage(null);
        }, 4000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to dispatch password reset. Please verify the email address.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('chess_saved_email', email.trim());
      } else {
        localStorage.removeItem('chess_saved_email');
      }

      if (authMode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
        setSuccessMessage('Account successfully created! Welcome to ChessApp.');
      } else {
        await signInWithEmail(email.trim(), password);
        setSuccessMessage('Successfully signed in.');
      }

      const currentUser = user || auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
      }

      if (onSuccess) onSuccess();
      else if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password combination.');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No user found with this email. Would you like to Create an Account?');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else {
        setErrorMessage(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };`;

code = code.replace(handleEmailSubmitRegex, newHandleEmailSubmit);

// Add confirmPassword field to the form
const passwordFieldRegex = /(<input\s+type=\{showPassword \? 'text' : 'password'\}[\s\S]*?<\/button>\s*<\/div>)/;
const confirmPasswordField = `
            {authMode === 'signup' && (
              <div className="relative mt-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-9 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
              </div>
            )}`;

code = code.replace(passwordFieldRegex, `$1${confirmPasswordField}`);

// Also update Google/Apple logins to set the cookie
code = code.replace(/await signInWithGoogle\(\);/g, `await signInWithGoogle();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await fetch('/api/auth/session-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      }`);
      
code = code.replace(/import \{ useAuth \} from '\.\.\/context\/AuthContext';/g, `import { useAuth } from '../context/AuthContext';\nimport { auth } from '../utils/firebase';`);

fs.writeFileSync('src/components/LoginPage.tsx', code);
