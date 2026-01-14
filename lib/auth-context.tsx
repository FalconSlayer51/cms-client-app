"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { loginUser, signupUser } from "./api-client"

export type UserRole = "viewer" | "editor" | "admin"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name?: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser | null) => void
  canEdit: () => boolean
  canCreateUsers: () => boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken.split(".")[1]))
        setUser({
          id: decoded.id || decoded.sub || "",
          email: decoded.email,
          role: (decoded.role || "viewer").toLowerCase(),
          name: decoded.name || undefined,
        })
        setToken(storedToken)
      } catch {
        localStorage.removeItem("auth_token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginUser({ email, password })
      localStorage.setItem("auth_token", response.accessToken)
      setToken(response.accessToken)
      // Decode JWT for claims
      const decoded = JSON.parse(atob(response.accessToken.split(".")[1]))
      setUser({
        id: decoded.id || decoded.sub || "",
        email: decoded.email,
        role: (decoded.role || "viewer").toLowerCase(),
        name: decoded.name || undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, _name: string) => {
    setIsLoading(true)
    try {
      // Default role to 'viewer' for signup, adjust as needed
      await signupUser({ email, password, role: "viewer" });
      // After signup, immediately login
      await login(email, password);
    } finally {
      setIsLoading(false)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    setUser(null)
    setToken(null)
  }, [])

  const canEdit = useCallback(() => user?.role === "editor" || user?.role === "admin", [user])

  const canCreateUsers = useCallback(() => user?.role === "admin", [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setUser,
        canEdit,
        canCreateUsers,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
