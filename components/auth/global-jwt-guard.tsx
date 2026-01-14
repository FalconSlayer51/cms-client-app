"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function GlobalJwtGuard() {
  const router = useRouter()

  useEffect(() => {
    const checkJwt = () => {
      const token = localStorage.getItem("auth_token")
      if (!token) return
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]))
        if (decoded.exp && Date.now() / 1000 > decoded.exp) {
          localStorage.removeItem("auth_token")
          router.push("/login")
        }
      } catch {
        localStorage.removeItem("auth_token")
        router.push("/login")
      }
    }
    checkJwt()
    const interval = setInterval(checkJwt, 10_000)
    return () => clearInterval(interval)
  }, [router])
  return null
}
