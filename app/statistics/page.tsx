"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calculator, TrendingUp, TrendingDown, Brain, Download, Eye, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface StockStats {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  averageVolume?: number
  marketCap?: number
  peRatio?: number
  eps?: number
  dividendYield?: number
  high52Week?: number
  low52Week?: number
  beta?: number
  bookValue?: number
  priceToBook?: number
  previousClose?: number
  open?: number
  dayHigh?: number
  dayLow?: number
}


export default function StatisticsPage() {
  const [selectedStock, setSelectedStock] = useState<StockStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const router = useRouter()

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`
    }
    return formatCurrency(value)
  }

  const formatVolume = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A"
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`
    }
    return value.toLocaleString()
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = async (stock: any) => {
    setIsLoading(true)
    try {
      // Get detailed stock statistics
      const response = await fetch(`/api/stocks/statistics?symbol=${stock.symbol}`)
      if (response.ok) {
        const statsData = await response.json()
        setSelectedStock(statsData)
      }
    } catch (error) {
      console.error('Error fetching stock statistics:', error)
    }
    setShowSearchResults(false)
    setSearchQuery('')
    setIsLoading(false)
  }

  const handleAnalyzeWithRemoteAgent = async () => {
    if (!selectedStock) return

    setIsAnalyzing(true)

    try {
      // Create comprehensive analysis prompt
      const analysisPrompt = `Please provide a comprehensive and detailed financial analysis of ${selectedStock.symbol} (${selectedStock.name}) based on the following current market data:

📊 CURRENT MARKET DATA:
• Current Price: ${formatCurrency(selectedStock.price)}
• Market Capitalization: ${formatNumber(selectedStock.marketCap)}
• Price-to-Earnings Ratio: ${selectedStock.peRatio || 'N/A'}
• Earnings Per Share: ${selectedStock.eps ? formatCurrency(selectedStock.eps) : 'N/A'}
• Price-to-Book Ratio: ${selectedStock.priceToBook?.toFixed(2) || 'N/A'}
• Book Value: ${selectedStock.bookValue ? formatCurrency(selectedStock.bookValue) : 'N/A'}
• 52-Week High: ${formatCurrency(selectedStock.high52Week)}
• 52-Week Low: ${formatCurrency(selectedStock.low52Week)}
• Daily Trading Volume: ${formatVolume(selectedStock.volume)}
• Average Volume: ${formatVolume(selectedStock.averageVolume)}
• Beta (Volatility): ${selectedStock.beta || 'N/A'}
• Dividend Yield: ${selectedStock.dividendYield ? (selectedStock.dividendYield * 100).toFixed(2) + '%' : 'N/A'}
• Previous Close: ${formatCurrency(selectedStock.previousClose)}
• Today's Open: ${formatCurrency(selectedStock.open)}
• Today's Range: ${formatCurrency(selectedStock.dayLow)} - ${formatCurrency(selectedStock.dayHigh)}

🎯 ANALYSIS REQUIREMENTS:
Please provide a detailed professional investment analysis covering:

1. **EXECUTIVE SUMMARY**
   - Overall investment thesis and recommendation (BUY/HOLD/SELL)
   - Key highlights and main conclusion

2. **FINANCIAL HEALTH ASSESSMENT**
   - Revenue and earnings quality analysis
   - Debt levels and financial stability
   - Cash flow and liquidity position
   - Profitability metrics evaluation

3. **VALUATION ANALYSIS**
   - Is the stock overvalued, undervalued, or fairly valued?
   - P/E ratio comparison to industry and market averages
   - Price-to-book and other valuation metrics analysis
   - Target price estimation with reasoning

4. **RISK ASSESSMENT**
   - Beta analysis and market risk exposure
   - Volatility patterns and price stability
   - Sector-specific risks and challenges
   - Regulatory and competitive risks

5. **TECHNICAL ANALYSIS**
   - Current price position relative to 52-week range
   - Volume analysis and trading patterns
   - Support and resistance levels identification
   - Momentum indicators assessment

6. **DIVIDEND AND INCOME ANALYSIS**
   - Dividend sustainability and growth potential
   - Yield attractiveness vs. market alternatives
   - Payout ratio and coverage analysis

7. **COMPETITIVE POSITIONING**
   - Market share and competitive advantages
   - Industry comparison and peer analysis
   - Business model strength and moat analysis

8. **GROWTH PROSPECTS**
   - Revenue and earnings growth expectations
   - Market expansion opportunities
   - Innovation and R&D investments
   - Management quality and strategy execution

9. **INVESTMENT TIMEFRAME RECOMMENDATIONS**
   - Short-term outlook (3-6 months)
   - Medium-term prospects (1-2 years)
   - Long-term investment potential (5+ years)

10. **KEY RISKS TO MONITOR**
    - Specific company risks to watch
    - Market conditions that could impact performance
    - Potential catalysts (positive and negative)

Please format your response as a professional investment research report with clear sections, bullet points where appropriate, and specific numerical targets where possible. Include disclaimers about investment risks and the importance of conducting additional research.`

      // Call the remote agent API
      const response = await fetch('/api/remoteagent/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          symbol: selectedStock.symbol,
          data: selectedStock
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newReportId = `report_${selectedStock.symbol}_${Date.now()}`
        setReportId(newReportId)
        setAnalysisComplete(true)

        // Store the analysis result in localStorage for the report page
        localStorage.setItem(newReportId, JSON.stringify({
          symbol: selectedStock.symbol,
          analysis: result.analysis || result.response,
          timestamp: new Date().toISOString(),
          data: selectedStock
        }))

        toast.success(
          'Analysis complete! Detailed report is ready to download or view.',
          {
            duration: 5000,
            position: 'top-right',
            style: {
              background: '#000000',
              color: 'white',
            },
          }
        )
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(
        'Analysis failed. Please try again later.',
        {
          duration: 4000,
          position: 'top-right',
        }
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!reportId || !selectedStock) return

    const reportData = localStorage.getItem(reportId)
    if (reportData) {
      try {
        const { default: jsPDF } = await import('jspdf')
        const data = JSON.parse(reportData)

        // Create PDF with professional formatting
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margins = { left: 20, right: 20, top: 25, bottom: 25 }
        const contentWidth = pageWidth - margins.left - margins.right

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
        pdf.text(`${data.symbol} • Professional Investment Analysis`, margins.left + 35, 30)

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
        pdf.text(new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), margins.left + 30, yPos)

        yPos += 7
        pdf.setFont('helvetica', 'bold')
        pdf.text('Symbol:', margins.left + 10, yPos)
        pdf.setFont('helvetica', 'normal')
        pdf.text(data.symbol, margins.left + 35, yPos)

        // Add current price prominently
        pdf.setFont('helvetica', 'bold')
        pdf.text('Current Price:', margins.left + 100, yPos - 7)
        pdf.setTextColor(34, 197, 94) // Green color
        pdf.setFontSize(12)
        pdf.text(formatCurrency(selectedStock.price), margins.left + 145, yPos - 7)

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
        const summaryText = `This comprehensive AI-powered analysis of ${data.symbol} provides detailed insights into financial performance, valuation metrics, and investment potential based on current market data and advanced analytical algorithms.`
        const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 20)
        summaryLines.forEach((line: string, index: number) => {
          pdf.text(line, margins.left + 10, yPos + (index * 4))
        })

        yPos += 25

        // Format and add analysis content
        if (data.analysis) {
          yPos = formatAnalysisContent(data.analysis, yPos)
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
        const fileName = `StockFlow_${selectedStock.symbol}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)

        toast.success('Professional PDF report downloaded successfully!', {
          position: 'top-right',
        })
      } catch (error) {
        console.error('PDF generation error:', error)
        toast.error('Failed to generate PDF. Please try again.', {
          position: 'top-right',
        })
      }
    }
  }

  const handleViewReport = () => {
    if (!reportId) return
    router.push(`/analysis-report?id=${reportId}`)
  }

  const statsCards = selectedStock ? [
    {
      title: "Market Valuation",
      items: [
        { label: "Market Cap", value: formatNumber(selectedStock.marketCap) },
        { label: "P/E Ratio", value: selectedStock.peRatio?.toFixed(2) || "N/A" },
        { label: "EPS", value: selectedStock.eps ? formatCurrency(selectedStock.eps) : "N/A" },
        { label: "Price to Book", value: selectedStock.priceToBook?.toFixed(2) || "N/A" },
      ]
    },
    {
      title: "Price Performance",
      items: [
        { label: "Current Price", value: formatCurrency(selectedStock.price) },
        { label: "Previous Close", value: formatCurrency(selectedStock.previousClose) },
        { label: "Open", value: formatCurrency(selectedStock.open) },
        { label: "Day Range", value: `${formatCurrency(selectedStock.dayLow)} - ${formatCurrency(selectedStock.dayHigh)}` },
      ]
    },
    {
      title: "52-Week Performance",
      items: [
        { label: "52-Week High", value: formatCurrency(selectedStock.high52Week) },
        { label: "52-Week Low", value: formatCurrency(selectedStock.low52Week) },
        { label: "Current vs High", value: selectedStock.high52Week ? `${(((selectedStock.price - selectedStock.high52Week) / selectedStock.high52Week) * 100).toFixed(2)}%` : "N/A" },
        { label: "Current vs Low", value: selectedStock.low52Week ? `${(((selectedStock.price - selectedStock.low52Week) / selectedStock.low52Week) * 100).toFixed(2)}%` : "N/A" },
      ]
    },
    {
      title: "Trading Activity",
      items: [
        { label: "Volume", value: formatVolume(selectedStock.volume) },
        { label: "Avg Volume", value: formatVolume(selectedStock.averageVolume) },
        { label: "Beta", value: selectedStock.beta?.toFixed(2) || "N/A" },
        { label: "Dividend Yield", value: selectedStock.dividendYield ? `${(selectedStock.dividendYield * 100).toFixed(2)}%` : "N/A" },
      ]
    }
  ] : []

  return (
    <DashboardLayout>
      <Toaster />
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Calculator className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">Stock Statistics</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleAnalyzeWithRemoteAgent}
              disabled={isAnalyzing || !selectedStock}
              className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with Remote Agent
                </>
              )}
            </Button>
            {analysisComplete && reportId && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  className="border-black text-black hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button
                  onClick={handleViewReport}
                  className="bg-white border border-black text-black hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time data</span>
            </div>
          </div>
        </div>

        {/* Stock Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Stock Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for stocks to view detailed statistics..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Results */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectSearchResult(result)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{result.symbol}</div>
                              <div className="text-sm text-gray-600 truncate">{result.name}</div>
                              <div className="text-xs text-gray-500">{result.exchange} • {result.type}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading statistics...</span>
            </div>
          </div>
        )}

        {/* Statistics Display */}
        {selectedStock && !isLoading && (
          <>
            {/* Header with current price */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedStock.symbol} - {selectedStock.name}
                    </h2>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(selectedStock.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-2 text-lg font-semibold ${
                      selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStock.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {selectedStock.change > 0 ? '+' : ''}{formatCurrency(selectedStock.change)}
                      </span>
                    </div>
                    <div className={`text-sm ${
                      selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStock.changePercent > 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statsCards.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-semibold text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedStock && !isLoading && (
          <Card className="text-center py-16">
            <CardContent>
              <Calculator className="mx-auto mb-4 text-gray-400 w-12 h-12" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a stock to view statistics
              </h3>
              <p className="text-gray-600">
                Search for and select a stock symbol above to view detailed financial statistics and metrics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}