"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Market Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <CardHeader className="space-y-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-4 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="skeleton h-6 w-16" />
              <div className="skeleton h-8 w-32" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-12" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="skeleton h-96 w-full" />
        </CardContent>
      </Card>

      {/* Stocks List Skeleton */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
        <CardContent className="p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="skeleton h-5 w-20" />
                <div className="skeleton h-4 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
