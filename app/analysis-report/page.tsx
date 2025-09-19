"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ArrowLeft, Download, FileText, Calendar, TrendingUp } from "lucide-react"
import toast, { Toaster } from 'react-hot-toast'

interface ReportData {
  symbol: string
  analysis: string
  timestamp: string
  data: any
}

export default function AnalysisReportPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reportId = searchParams.get('id')

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (reportId) {
      const storedData = localStorage.getItem(reportId)
      if (storedData) {
        try {
          const data = JSON.parse(storedData) as ReportData
          setReportData(data)
        } catch (error) {
          console.error('Error parsing report data:', error)
          toast.error('Failed to load report data')
        }
      } else {
        toast.error('Report not found')
      }
    }
    setIsLoading(false)
  }, [reportId])

  const handleDownloadReport = async () => {
    if (!reportData) return

    try {
      const { default: jsPDF } = await import('jspdf')

      // Create PDF with professional formatting
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margins = { left: 20, right: 20, top: 25, bottom: 25 }
      const contentWidth = pageWidth - margins.left - margins.right

      // Helper function for currency formatting
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      }

      // Helper function to add styled text with word wrapping
      const addStyledText = (text: string, x: number, y: number, options: {
        fontSize?: number,
        fontStyle?: 'normal' | 'bold' | 'italic',
        color?: [number, number, number],
        maxWidth?: number,
        lineHeight?: number,
        align?: 'left' | 'center' | 'right'
      } = {}) => {
        const {
          fontSize = 11,
          fontStyle = 'normal',
          color = [0, 0, 0],
          maxWidth = contentWidth,
          lineHeight = 6,
          align = 'left'
        } = options

        pdf.setFontSize(fontSize)
        pdf.setFont('helvetica', fontStyle)
        pdf.setTextColor(color[0], color[1], color[2])

        const lines = pdf.splitTextToSize(text, maxWidth)
        let currentY = y

        lines.forEach((line: string, index: number) => {
          const textX = align === 'center' ? x + maxWidth / 2 :
                       align === 'right' ? x + maxWidth : x
          pdf.text(line, textX, currentY, { align })
          if (index < lines.length - 1) currentY += lineHeight
        })

        return currentY + lineHeight
      }

      // Helper function to add section headers with background
      const addSectionHeader = (text: string, y: number) => {
        // Background rectangle
        pdf.setFillColor(59, 130, 246) // Blue background
        pdf.rect(margins.left - 5, y - 8, contentWidth + 10, 12, 'F')

        // Header text
        return addStyledText(text, margins.left, y, {
          fontSize: 14,
          fontStyle: 'bold',
          color: [255, 255, 255] // White text
        })
      }

      // Helper function to parse and format analysis content
      const formatAnalysisContent = (content: string, startY: number) => {
        let currentY = startY
        const sections = content.split(/(?=\d+\.\s*\*\*)|(?=#+\s)/) // Split on numbered sections or markdown headers

        sections.forEach((section) => {
          if (!section.trim()) return

          // Check for page break
          if (currentY > pageHeight - 50) {
            pdf.addPage()
            currentY = margins.top + 20
          }

          // Handle numbered sections (1. **Title**)
          const numberedSectionMatch = section.match(/^(\d+)\s*\.\s*\*\*(.+?)\*\*(.*)/s)
          if (numberedSectionMatch) {
            const [, number, title, content] = numberedSectionMatch

            // Add section header with number
            currentY = addSectionHeader(`${number}. ${title.trim()}`, currentY + 15)
            currentY += 5

            // Process section content
            const cleanContent = content.trim()
            if (cleanContent) {
              const paragraphs = cleanContent.split(/\n\n+/)

              paragraphs.forEach((paragraph) => {
                if (!paragraph.trim()) return

                // Check for page break
                if (currentY > pageHeight - 40) {
                  pdf.addPage()
                  currentY = margins.top + 20
                }

                // Handle bullet points
                if (paragraph.trim().match(/^[•-]/) || paragraph.includes('\n• ') || paragraph.includes('\n- ')) {
                  const bulletPoints = paragraph.split(/\n(?=[•-])/).filter(p => p.trim())
                  bulletPoints.forEach((point) => {
                    const cleanPoint = point.replace(/^[•-]\s*/, '').trim()
                    if (cleanPoint) {
                      // Bullet symbol
                      pdf.setTextColor(59, 130, 246)
                      pdf.text('•', margins.left + 5, currentY)

                      // Bullet text
                      currentY = addStyledText(cleanPoint, margins.left + 12, currentY, {
                        fontSize: 10,
                        color: [60, 60, 60],
                        maxWidth: contentWidth - 12,
                        lineHeight: 5
                      })
                      currentY += 3
                    }
                  })
                } else {
                  // Regular paragraph with bold text formatting
                  const parts = paragraph.split(/\*\*(.*?)\*\*/g)
                  let tempY = currentY

                  parts.forEach((part, index) => {
                    if (!part) return
                    const isBold = index % 2 === 1
                    tempY = addStyledText(part, margins.left, tempY, {
                      fontSize: 10,
                      fontStyle: isBold ? 'bold' : 'normal',
                      color: isBold ? [30, 30, 30] : [60, 60, 60],
                      lineHeight: 5.5
                    })
                  })
                  currentY = tempY + 4
                }
              })
            }
            currentY += 8
          } else {
            // Handle regular content without numbered sections
            currentY = addStyledText(section.trim(), margins.left, currentY, {
              fontSize: 10,
              color: [60, 60, 60],
              lineHeight: 5.5
            })
            currentY += 6
          }
        })

        return currentY
      }

      // Create header with gradient effect
      pdf.setFillColor(15, 23, 42) // Dark background
      pdf.rect(0, 0, pageWidth, 45, 'F')

      // Company logo area (placeholder)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(margins.left, 10, 25, 25, 'F')
      pdf.setTextColor(59, 130, 246)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('SF', margins.left + 12.5, 25, { align: 'center' })

      // Main title
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('STOCK ANALYSIS REPORT', margins.left + 35, 20)

      // Subtitle
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`${reportData.symbol} • Professional Investment Analysis`, margins.left + 35, 30)

      // Report metadata box
      let yPos = 55
      pdf.setFillColor(248, 250, 252) // Light gray background
      pdf.rect(margins.left, yPos, contentWidth, 35, 'F')
      pdf.setDrawColor(226, 232, 240) // Border color
      pdf.rect(margins.left, yPos, contentWidth, 35, 'S')

      // Report details
      yPos += 10
      pdf.setTextColor(71, 85, 105)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Generated by:', margins.left + 10, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text('StockFlow AI Remote Agent', margins.left + 45, yPos)

      yPos += 7
      pdf.setFont('helvetica', 'bold')
      pdf.text('Date:', margins.left + 10, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(new Date(reportData.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), margins.left + 30, yPos)

      yPos += 7
      pdf.setFont('helvetica', 'bold')
      pdf.text('Symbol:', margins.left + 10, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(reportData.symbol, margins.left + 35, yPos)

      // Add current price prominently if available
      if (reportData.data?.price) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Current Price:', margins.left + 100, yPos - 7)
        pdf.setTextColor(34, 197, 94) // Green color
        pdf.setFontSize(12)
        pdf.text(formatCurrency(reportData.data.price), margins.left + 145, yPos - 7)
      }

      yPos += 20

      // Executive Summary box
      pdf.setFillColor(239, 246, 255) // Light blue background
      const summaryHeight = 25
      pdf.rect(margins.left, yPos, contentWidth, summaryHeight, 'F')
      pdf.setDrawColor(59, 130, 246)
      pdf.setLineWidth(0.8)
      pdf.rect(margins.left, yPos, contentWidth, summaryHeight, 'S')

      yPos += 8
      pdf.setTextColor(30, 64, 175)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📊 EXECUTIVE SUMMARY', margins.left + 10, yPos)

      yPos += 8
      pdf.setTextColor(60, 60, 60)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const summaryText = `This comprehensive AI-powered analysis of ${reportData.symbol} provides detailed insights into financial performance, valuation metrics, and investment potential based on current market data and advanced analytical algorithms.`
      const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 20)
      summaryLines.forEach((line: string, index: number) => {
        pdf.text(line, margins.left + 10, yPos + (index * 4))
      })

      yPos += 25

      // Format and add analysis content
      if (reportData.analysis) {
        yPos = formatAnalysisContent(reportData.analysis, yPos)
      }

      // Add professional footer to each page
      const totalPages = pdf.getNumberOfPages()
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        pdf.setPage(pageNum)

        // Footer background
        pdf.setFillColor(248, 250, 252)
        pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F')

        // Disclaimer
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(107, 114, 128)
        const disclaimer = 'DISCLAIMER: This AI-generated report is for informational purposes only. Not investment advice. Consult financial professionals before making investment decisions.'
        const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth)
        let disclaimerY = pageHeight - 22
        disclaimerLines.forEach((line: string) => {
          pdf.text(line, margins.left, disclaimerY)
          disclaimerY += 3.5
        })

        // Page number and branding
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`StockFlow AI • Page ${pageNum} of ${totalPages}`, pageWidth - 50, pageHeight - 8, { align: 'right' })

        // Timestamp
        pdf.text(new Date().toLocaleDateString(), margins.left, pageHeight - 8)
      }

      // Save the PDF with enhanced filename
      const fileName = `StockFlow_${reportData.symbol}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast.success('Professional PDF report downloaded successfully!', {
        duration: 3000,
        position: 'top-right',
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.', {
        duration: 4000,
        position: 'top-right',
      })
    }
  }

  const formatAnalysisText = (text: string) => {
    const sections = text.split('\n\n')

    return sections.map((section, sectionIndex) => {
      const lines = section.split('\n')

      // Check if this is a main section header (contains numbers like "1.", "2." etc.)
      if (lines[0] && lines[0].match(/^\d+\.\s*\*\*([^*]+)\*\*/)) {
        const headerMatch = lines[0].match(/^\d+\.\s*\*\*([^*]+)\*\*/)
        const headerText = headerMatch ? headerMatch[1] : lines[0]
        const remainingText = lines.slice(1).join('\n')

        return (
          <div key={sectionIndex} className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-900 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">
                  {lines[0].match(/^\d+/) ? lines[0].match(/^\d+/)?.[0] : '•'}
                </span>
                {headerText}
              </h3>
            </div>
            <div className="pl-6 space-y-2">
              {formatSectionContent(remainingText)}
            </div>
          </div>
        )
      }

      // Regular content formatting
      return (
        <div key={sectionIndex} className="mb-6 space-y-2">
          {lines.map((line, lineIndex) => {
            if (line.trim() === '') return <div key={lineIndex} className="h-2"></div>

            // Bold headers (**text**)
            if (line.includes('**')) {
              const parts = line.split(/\*\*(.*?)\*\*/)
              return (
                <div key={lineIndex} className="font-semibold text-gray-800 text-lg mb-3 mt-4">
                  {parts.map((part, i) => (
                    i % 2 === 1 ? <strong key={i} className="text-blue-800">{part}</strong> : part
                  ))}
                </div>
              )
            }

            // Bullet points
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
              return (
                <div key={lineIndex} className="flex items-start ml-4 mb-2">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700 leading-relaxed">{line.replace(/^[•-]\s*/, '')}</span>
                </div>
              )
            }

            // Regular text
            return (
              <div key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
                {line}
              </div>
            )
          })}
        </div>
      )
    })
  }

  const formatSectionContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <div key={index} className="h-1"></div>

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start mb-2">
            <span className="text-blue-500 mr-2 mt-1 text-sm">▪</span>
            <span className="text-gray-700 text-sm leading-relaxed">{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        )
      }

      return (
        <div key={index} className="text-gray-700 text-sm leading-relaxed mb-2">
          {line}
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <Toaster />
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md w-full">
              <CardContent className="text-center py-8">
                <FileText className="mx-auto mb-4 text-gray-400 w-12 h-12" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Report Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  The requested analysis report could not be found.
                </p>
                <Button onClick={() => router.push('/statistics')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Statistics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/statistics')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Statistics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analysis Report</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{reportData.symbol}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(reportData.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleDownloadReport}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>

        {/* Report Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Report Header Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <img
                    src="https://avatars.githubusercontent.com/u/223376538?s=200&v=4"
                    alt="AI Analysis"
                    className="w-12 h-12 rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold mb-2">
                    📊 Stock Analysis Report: {reportData.symbol}
                  </CardTitle>
                  <div className="text-blue-200 text-sm">
                    🤖 Generated by StockFlow AI Remote Agent • {new Date(reportData.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-sm">Analysis Complete</div>
                  <div className="bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-xs mt-1">
                    ✅ Professional Report
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Executive Summary */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <CardTitle className="text-xl text-emerald-800 flex items-center">
                <span className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">
                  📋
                </span>
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="text-gray-700 leading-relaxed">
                  <p className="font-semibold text-blue-900 mb-3">
                    🎯 Comprehensive AI-Powered Financial Analysis
                  </p>
                  <p>
                    This detailed analysis leverages advanced AI algorithms to evaluate the financial performance,
                    market positioning, and investment potential of <strong className="text-blue-800">{reportData.symbol}</strong>.
                    Our analysis covers 10 key areas including financial health, valuation metrics, risk assessment,
                    and growth prospects to provide you with actionable investment insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Analysis Content */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-xl text-blue-800 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">
                  🔍
                </span>
                Detailed Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {formatAnalysisText(reportData.analysis)}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-amber-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
              <CardTitle className="text-lg text-amber-800 flex items-center">
                <span className="text-amber-600 mr-3">⚠️</span>
                Investment Disclaimer & Risk Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-amber-50/30">
              <div className="space-y-4 text-amber-800">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 mt-1">🚨</span>
                  <p className="text-sm leading-relaxed">
                    <strong>AI-Generated Analysis:</strong> This report is generated by artificial intelligence
                    and is provided for informational purposes only. It should not be considered as personalized
                    investment advice or a recommendation to buy, sell, or hold any security.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 mt-1">📊</span>
                  <p className="text-sm leading-relaxed">
                    <strong>Professional Consultation Required:</strong> Always conduct your own research and
                    consult with qualified financial advisors before making any investment decisions. Past
                    performance does not guarantee future results.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 mt-1">💰</span>
                  <p className="text-sm leading-relaxed">
                    <strong>Risk Acknowledgment:</strong> All investments carry risk of loss. You should only
                    invest money you can afford to lose and ensure any investment aligns with your risk
                    tolerance and financial objectives.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-700">
                🚀 StockFlow AI Analysis Engine
              </div>
              <div className="text-sm text-gray-500">
                Report generated on {new Date(reportData.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                Powered by Advanced AI Financial Analysis Technology
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}