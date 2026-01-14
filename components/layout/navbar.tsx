"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="font-bold text-foreground">EduHub</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role !== "viewer" && (
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-foreground hover:bg-secondary">
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-border text-foreground hover:bg-secondary bg-transparent"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
