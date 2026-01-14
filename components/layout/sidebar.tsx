"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (href: string) => pathname === href

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "My Programs", href: "/dashboard/programs", icon: "📚" },
    { label: "Create Program", href: "/dashboard/create-program", icon: "➕" },
  ]

  // Removed Users tab for all roles

  return (
    <aside className="hidden w-64 border-r border-border bg-card md:block">
      <div className="sticky top-0 space-y-4 p-6">
        <h2 className="text-lg font-bold text-foreground">Menu</h2>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.href) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Users tab removed */}
        </nav>
      </div>
    </aside>
  )
}
