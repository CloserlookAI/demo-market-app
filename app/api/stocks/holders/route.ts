import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      )
    }

    // Try to get holders data (this might not be available in yahoo-finance2)
    try {
      const holdersData = await yahooFinance.quoteSummary(symbol, {
        modules: ['institutionOwnership', 'fundOwnership', 'majorDirectHolders', 'insiderTransactions', 'ownershipSummary']
      })

      const data = {
        institutionalHolders: holdersData.institutionOwnership?.ownershipList?.map((holder: any) => ({
          organization: holder.organization,
          pctHeld: holder.pctHeld * 100,
          position: holder.position,
          value: holder.value
        })) || [],
        mutualFundHolders: holdersData.fundOwnership?.ownershipList?.map((holder: any) => ({
          organization: holder.organization,
          pctHeld: holder.pctHeld * 100,
          position: holder.position,
          value: holder.value
        })) || [],
        majorDirectHolders: holdersData.majorDirectHolders?.holders?.map((holder: any) => ({
          organization: holder.name,
          pctHeld: holder.pctHeld * 100,
          position: holder.position,
          value: holder.value
        })) || [],
        insiderTransactions: holdersData.insiderTransactions?.transactions?.map((transaction: any) => ({
          insider: transaction.filerName,
          relation: transaction.filerRelation,
          transactionType: transaction.transactionText,
          shares: transaction.shares,
          value: transaction.value,
          date: transaction.startDate
        })) || [],
        ownershipBreakdown: {
          institutionalPercent: holdersData.ownershipSummary?.institutionsPercentHeld * 100 || 0,
          insiderPercent: holdersData.ownershipSummary?.insidersPercentHeld * 100 || 0,
          floatPercent: holdersData.ownershipSummary?.floatPercentHeld * 100 || 0
        }
      }

      return NextResponse.json(data)
    } catch (error) {
      // If Yahoo Finance doesn't have holders data, return mock data
      throw new Error("Holders data not available from Yahoo Finance")
    }

  } catch (error) {
    console.error("Holders API error:", error)

    // Return mock holders data
    const mockHoldersData = {
      institutionalHolders: [
        {
          organization: "Vanguard Group Inc",
          pctHeld: 7.85,
          position: 1264000000,
          value: 189600000000
        },
        {
          organization: "BlackRock Inc.",
          pctHeld: 6.22,
          position: 1002000000,
          value: 150300000000
        },
        {
          organization: "Berkshire Hathaway Inc",
          pctHeld: 5.57,
          position: 896000000,
          value: 134400000000
        },
        {
          organization: "State Street Corp",
          pctHeld: 3.85,
          position: 620000000,
          value: 93000000000
        },
        {
          organization: "FMR LLC",
          pctHeld: 2.31,
          position: 372000000,
          value: 55800000000
        }
      ],
      mutualFundHolders: [
        {
          organization: "Vanguard 500 Index Fund",
          pctHeld: 3.12,
          position: 502000000,
          value: 75300000000
        },
        {
          organization: "Vanguard Total Stock Mkt Index Fund",
          pctHeld: 2.45,
          position: 394000000,
          value: 59100000000
        },
        {
          organization: "SPDR S&P 500 ETF Trust",
          pctHeld: 1.98,
          position: 318000000,
          value: 47700000000
        },
        {
          organization: "Fidelity 500 Index Fund",
          pctHeld: 1.76,
          position: 283000000,
          value: 42450000000
        },
        {
          organization: "iShares Core S&P 500 ETF",
          pctHeld: 1.54,
          position: 248000000,
          value: 37200000000
        }
      ],
      majorDirectHolders: [
        {
          organization: "Timothy D. Cook",
          pctHeld: 0.02,
          position: 3200000,
          value: 480000000
        },
        {
          organization: "Arthur D. Levinson",
          pctHeld: 0.003,
          position: 45000,
          value: 6750000
        }
      ],
      insiderTransactions: [
        {
          insider: "Timothy D. Cook",
          relation: "Chief Executive Officer",
          transactionType: "Sale",
          shares: 223000,
          value: 33450000,
          date: "2024-10-01"
        },
        {
          insider: "Luca Maestri",
          relation: "Senior Vice President, CFO",
          transactionType: "Sale",
          shares: 95000,
          value: 14250000,
          date: "2024-09-28"
        },
        {
          insider: "Katherine L. Adams",
          relation: "Senior Vice President, General Counsel",
          transactionType: "Sale",
          shares: 25000,
          value: 3750000,
          date: "2024-09-25"
        }
      ],
      ownershipBreakdown: {
        institutionalPercent: 59.7,
        insiderPercent: 0.07,
        floatPercent: 99.9
      }
    }

    return NextResponse.json({
      ...mockHoldersData,
      fallback: true
    })
  }
}