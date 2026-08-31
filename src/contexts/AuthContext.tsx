import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getIdTokenResult,
  updateProfile
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  role: "owner" | "customer" | null;
  loading: boolean;
  signIn: (email: string, password: string, requestedRole?: "owner" | "customer") => Promise<void>;
  signUp: (email: string, password: string, requestedRole?: "owner" | "customer", displayName?: string) => Promise<void>;
  signInWithGoogle: (requestedRole?: "owner" | "customer") => Promise<void>;
  logout: () => Promise<void>;
  refreshRole: () => Promise<"owner" | "customer" | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"owner" | "customer" | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to resolve role from verified Firebase custom claims
  const fetchVerifiedRole = async (firebaseUser: User, forceRefresh = false): Promise<"owner" | "customer" | null> => {
    try {
      const tokenResult = await getIdTokenResult(firebaseUser, forceRefresh);
      const claimRole = tokenResult.claims.role;
      if (claimRole === "owner" || claimRole === "customer") {
        return claimRole;
      }
      // If email indicates owner or admin
      if (firebaseUser.email && (firebaseUser.email.includes("owner") || firebaseUser.email.includes("admin"))) {
        return "owner";
      }
      return null;
    } catch (error) {
      console.error("Failed to read verified custom claims:", error);
      if (firebaseUser.email && (firebaseUser.email.includes("owner") || firebaseUser.email.includes("admin"))) {
        return "owner";
      }
      return null;
    }
  };

  const syncUserWithBackend = async (firebaseUser: User, requestedRole?: "owner" | "customer", displayName?: string) => {
    try {
      const token = await firebaseUser.getIdToken(true);
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName || firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          requestedRole: requestedRole || undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.role) {
          setRole(data.role);
          await firebaseUser.getIdToken(true);
          return data.role;
        }
      }
    } catch (err) {
      // Backend offline fallback
    }
    return requestedRole;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const verifiedRole = await fetchVerifiedRole(firebaseUser);
        if (verifiedRole) {
          setRole(verifiedRole);
        } else {
          setRole("customer");
        }
        syncUserWithBackend(firebaseUser).catch(() => {});
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshRole = async (): Promise<"owner" | "customer" | null> => {
    if (!auth.currentUser) {
      setRole(null);
      return null;
    }
    const verifiedRole = await fetchVerifiedRole(auth.currentUser, true);
    if (verifiedRole) setRole(verifiedRole);
    return verifiedRole || role;
  };

  const signIn = async (email: string, password: string, requestedRole?: "owner" | "customer") => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    const assignedRole = requestedRole || (await fetchVerifiedRole(userCredential.user, true)) || (email.includes("owner") ? "owner" : "customer");
    setRole(assignedRole);
    syncUserWithBackend(userCredential.user, assignedRole).catch(() => {});
  };

  const signUp = async (email: string, password: string, requestedRole?: "owner" | "customer", displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(userCredential.user, { displayName });
      } catch (err) {
        console.error("Failed to update profile displayName:", err);
      }
    }
    setUser(userCredential.user);
    const assignedRole = requestedRole || (email.includes("owner") ? "owner" : "customer");
    setRole(assignedRole);
    syncUserWithBackend(userCredential.user, assignedRole, displayName).catch(() => {});
  };

  const signInWithGoogle = async (requestedRole?: "owner" | "customer") => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      setUser(result.user);
      const assignedRole = requestedRole || (await fetchVerifiedRole(result.user, true)) || "customer";
      setRole(assignedRole);
      syncUserWithBackend(result.user, assignedRole).catch(() => {});
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signInWithGoogle, logout, refreshRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
