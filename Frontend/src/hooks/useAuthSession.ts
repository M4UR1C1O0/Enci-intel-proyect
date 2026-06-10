import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { observeAuthState } from "../services/auth";
import { getCurrentSession, type AuthSession } from "../services/session";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = observeAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);

      if (!firebaseUser) {
        setSession(null);
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          const currentSession = await getCurrentSession();
          if (!cancelled) {
            setSession(currentSession);
          }
        } catch {
          if (!cancelled) {
            setSession(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { user, session, loading };
}