// FILE: frontend/src/hooks/useAuth.ts
import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}
