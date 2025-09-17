"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Search, Bell, Settings, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function EnhancedHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "border-b border-border sticky top-0 z-40 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-card/80 backdrop-blur-sm",
      )}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center hover-lift transition-all duration-300">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground hover:text-gradient transition-all duration-300">
                StockFlow
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  LIVE
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 animate-fade-in">
            {/* Search */}
            <div className="relative group">
              <Search
                className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-300",
                  searchFocused ? "text-primary scale-110" : "text-muted-foreground",
                )}
              />
              <input
                type="text"
                placeholder="Search stocks..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-64 transition-all duration-300 bg-input text-foreground placeholder-muted-foreground",
                  searchFocused
                    ? "border-primary shadow-md scale-105"
                    : "border-border hover:border-primary/50",
                )}
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="hover-lift relative overflow-hidden group"
                onClick={() => setNotifications(0)}
              >
                <Bell className="w-5 h-5 group-hover:animate-pulse" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center animate-pulse"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="hover-lift group">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </Button>

            {/* Menu */}
            <Button variant="ghost" size="icon" className="hover-lift group md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}