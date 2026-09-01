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

export interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
}

interface AuthContextType {
  user: User | DemoUser | null;
  role: "owner" | "customer" | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string, requestedRole?: "owner" | "customer") => Promise<void>;
  signUp: (email: string, password: string, requestedRole?: "owner" | "customer", displayName?: string) => Promise<void>;
  signInWithGoogle: (requestedRole?: "owner" | "customer") => Promise<void>;
  loginAsDemo: (role: "owner" | "customer") => Promise<void>;
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

const DEMO_CUSTOMER_USER: DemoUser = {
  uid: "demo-customer-uid-101",
  email: "demo.customer@tastepulse.com",
  displayName: "Demo Diner (Customer)",
  getIdToken: async () => "demo_customer_token"
};

const DEMO_OWNER_USER: DemoUser = {
  uid: "demo-owner-uid-202",
  email: "demo.owner@tastepulse.com",
  displayName: "Chef Marco (Demo Owner)",
  getIdToken: async () => "demo_owner_token"
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [role, setRole] = useState<"owner" | "customer" | null>(null);
  const [isDemo, setIsDemo] = useState(false);
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

  const syncUserWithBackend = async (firebaseUser: User | DemoUser, requestedRole?: "owner" | "customer", displayName?: string) => {
    try {
      const token = firebaseUser.getIdToken ? await firebaseUser.getIdToken(true) : "demo_token";
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
          if ('getIdToken' in firebaseUser && firebaseUser.getIdToken) {
            await firebaseUser.getIdToken(true);
          }
          return data.role;
        }
      }
    } catch (err) {
      // Backend offline fallback
    }
    return requestedRole;
  };

  useEffect(() => {
    // Check if demo user was saved in localStorage
    const savedDemoRole = localStorage.getItem("tastepulse_demo_role") as "owner" | "customer" | null;
    
    let unsubscribe = () => {};
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 400);

    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          clearTimeout(safetyTimer);
          if (firebaseUser) {
            setUser(firebaseUser);
            setIsDemo(false);
            localStorage.removeItem("tastepulse_demo_role");
            const verifiedRole = await fetchVerifiedRole(firebaseUser);
            if (verifiedRole) {
              setRole(verifiedRole);
            } else {
              setRole("customer");
            }
            syncUserWithBackend(firebaseUser).catch(() => {});
          } else if (savedDemoRole) {
            // Restore demo session
            setIsDemo(true);
            if (savedDemoRole === "owner") {
              setUser(DEMO_OWNER_USER);
              setRole("owner");
            } else {
              setUser(DEMO_CUSTOMER_USER);
              setRole("customer");
            }
          } else {
            setUser(null);
            setRole(null);
            setIsDemo(false);
          }
          setLoading(false);
        }, (error) => {
          console.warn("Auth state observer error:", error);
          clearTimeout(safetyTimer);
          setLoading(false);
        });
      } else {
        if (savedDemoRole) {
          setIsDemo(true);
          setUser(savedDemoRole === "owner" ? DEMO_OWNER_USER : DEMO_CUSTOMER_USER);
          setRole(savedDemoRole);
        }
        setLoading(false);
      }
    } catch (err) {
      console.warn("Auth initialization error (Shields/offline mode):", err);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const refreshRole = async (): Promise<"owner" | "customer" | null> => {
    if (isDemo) return role;
    if (!auth || !auth.currentUser) {
      setRole(null);
      return null;
    }
    const verifiedRole = await fetchVerifiedRole(auth.currentUser, true);
    if (verifiedRole) setRole(verifiedRole);
    return verifiedRole || role;
  };

  const loginAsDemo = async (targetRole: "owner" | "customer") => {
    setLoading(true);
    try {
      setIsDemo(true);
      localStorage.setItem("tastepulse_demo_role", targetRole);
      
      const demoUserObj = targetRole === "owner" ? DEMO_OWNER_USER : DEMO_CUSTOMER_USER;
      setUser(demoUserObj);
      setRole(targetRole);

      // Attempt background Firebase sign-in if possible, but don't block
      if (auth && typeof auth.signInWithEmailAndPassword === 'function') {
        const demoEmail = targetRole === "owner" ? "owner.demo@tastepulse.com" : "customer.demo@tastepulse.com";
        const demoPassword = "DemoUser123!#";
        try {
          await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        } catch (err: any) {
          if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
            try {
              await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
              if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                  displayName: targetRole === "owner" ? "Chef Marco (Demo Owner)" : "Demo Diner (Customer)"
                });
              }
            } catch {
              // Standalone demo fallback mode active
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, requestedRole?: "owner" | "customer") => {
    localStorage.removeItem("tastepulse_demo_role");
    setIsDemo(false);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    const assignedRole = requestedRole || (await fetchVerifiedRole(userCredential.user, true)) || (email.includes("owner") ? "owner" : "customer");
    setRole(assignedRole);
    syncUserWithBackend(userCredential.user, assignedRole).catch(() => {});
  };

  const signUp = async (email: string, password: string, requestedRole?: "owner" | "customer", displayName?: string) => {
    localStorage.removeItem("tastepulse_demo_role");
    setIsDemo(false);
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
    localStorage.removeItem("tastepulse_demo_role");
    setIsDemo(false);
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
    localStorage.removeItem("tastepulse_demo_role");
    setIsDemo(false);
    try {
      if (auth && typeof auth.signOut === 'function') {
        await signOut(auth);
      }
    } catch {
      // Ignored
    }
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, isDemo, signIn, signUp, signInWithGoogle, loginAsDemo, logout, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

