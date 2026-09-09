import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "="))
    );
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const claims = token ? decodeJwt(token) : null;
    if (!stored || !claims || (claims.exp && claims.exp * 1000 <= Date.now())) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  async function login(email, password, loginType) {
    setLoading(true);

    try {
      // Only /users/login and /admin/login exist on the backend today —
      // there's no supplier login endpoint yet, so that role isn't offered.
      const endpoint = loginType === "ADMIN" ? "/admin/login" : "/users/login";

      const res = await client.post(endpoint, {
        email,
        password,
      });

      const token = res.data;

      if (!token || token.startsWith("Invalid")) {
        throw new Error("Invalid email or password");
      }

      localStorage.setItem("token", token);

      const claims = decodeJwt(token);

      let fullUser = null;

      if (loginType !== "ADMIN") {
        const usersRes = await client.get("/users");
        fullUser = usersRes.data.find((u) => u.email === email);
      }

      const sessionUser = {
        email: claims?.sub ?? email,
        role: claims?.role ?? loginType,
        userId: fullUser?.userId,
        name: fullUser?.name,
        // Note: User.department is @JsonIgnore on the backend, so it never
        // comes back from GET /users — intentionally left out here rather
        // than storing a field that will always be undefined.
        designation: fullUser?.designation,
      };

      setUser(sessionUser);

      return sessionUser;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);

    try {
      await client.post("/users", payload);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
