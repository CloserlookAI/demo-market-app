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

        // Create PDF with proper formatting
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        // Add header
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text('STOCK ANALYSIS REPORT', 20, 25)

        // Add subheader
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Generated by StockFlow AI Remote Agent', 20, 35)
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42)
        pdf.text(`Symbol: ${data.symbol}`, 20, 49)
        pdf.text(`Current Price: ${formatCurrency(selectedStock.price)}`, 20, 56)

        // Add line separator
        pdf.setLineWidth(0.5)
        pdf.line(20, 65, pageWidth - 20, 65)

        let yPosition = 75

        // Split analysis text into chunks that fit on pages
        if (data.analysis) {
          pdf.setFontSize(10)
          const lines = pdf.splitTextToSize(data.analysis, pageWidth - 40)
          const lineHeight = 5

          for (let i = 0; i < lines.length; i++) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage()
              yPosition = 20
            }

            pdf.text(lines[i], 20, yPosition)
            yPosition += lineHeight
          }
        }

        // Add footer on each page
        const totalPages = pdf.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i)

          // Disclaimer footer
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'italic')
          const disclaimer = 'DISCLAIMER: This report is for informational purposes only and should not be considered as investment advice.'
          const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 40)
          let disclaimerY = pageHeight - 25

          disclaimerLines.forEach((line: string) => {
            pdf.text(line, 20, disclaimerY)
            disclaimerY += 4
          })

          // Page number
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10)
        }

        // Save the PDF
        const fileName = `${selectedStock.symbol}_analysis_report_${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)

        toast.success('PDF report downloaded successfully!', {
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