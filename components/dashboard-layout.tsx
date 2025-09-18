"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { AIChatbot } from "./ai-chatbot"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {/* AI Chatbot available across all dashboard routes */}
      <AIChatbot />
    </div>
  )
}