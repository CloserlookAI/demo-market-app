"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  TrendingUp,
  Newspaper,
  Calculator,
  Building2,
  History,
  Users,
  Star,
  ChevronRight,
  BarChart3
} from "lucide-react"

const sidebarItems = [
  {
    name: "Favorites",
    href: "/favorites",
    icon: Star
  },
  {
    name: "News",
    href: "/news",
    icon: Newspaper
  },
  {
    name: "Statistics",
    href: "/statistics",
    icon: Calculator
  },
  {
    name: "Profile",
    href: "/profile",
    icon: Building2
  },
  {
    name: "Historical Data",
    href: "/historical",
    icon: History
  },
  {
    name: "Holders",
    href: "/holders",
    icon: Users
  },
  {
    name: "Analysis",
    href: "/analysis",
    icon: BarChart3
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex flex-col border-r border-gray-200 bg-white h-screen sticky top-0 transition-all duration-300 shadow-sm",
      isCollapsed ? "w-20" : "w-64",
      className
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]">
        <div className="flex items-center flex-1">
          {isCollapsed ? (
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          ) : (
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">StockFlow</span>
                <div className="text-xs text-gray-500 font-medium">Market Analytics</div>
              </div>
            </Link>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex-shrink-0",
            "hover:shadow-sm active:scale-95",
            isCollapsed && "ml-2"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-all duration-200",
              isCollapsed ? "rotate-0" : "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {/* Dashboard Link */}
          <Link
            href="/"
            className={cn(
              "flex items-center rounded-lg transition-all duration-200 group relative hover:shadow-sm",
              isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2 space-x-3",
              pathname === "/"
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <div className="flex-shrink-0">
              <Home className="w-5 h-5" />
            </div>
            {!isCollapsed && <span className="font-medium">Dashboard</span>}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-20 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-lg">
                Dashboard
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </Link>

          {/* Separator */}
          <div className="my-4">
            <div className="border-t border-gray-200"></div>
          </div>

          {/* Market Data Section */}
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Market Data</h3>
            </div>
          )}

          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group relative hover:shadow-sm",
                isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2 space-x-3",
                pathname === item.href
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <div className="flex-shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-20 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-lg">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center text-sm text-gray-600 group relative",
          isCollapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          {!isCollapsed && <span className="font-medium">Live Market Data</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-12 bottom-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
              Live Market Data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}