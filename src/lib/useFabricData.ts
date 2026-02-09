import { useState, useEffect, useCallback } from 'react'
import { fabricDatabaseService, type FabricOpportunity, type FabricDashboardMetrics } from './fabricDatabaseService'
import { fetchOpportunitiesFromFabric, fetchDashboardMetricsFromFabric } from './fabricDataAdapter'
import type { DetectedOpportunity, DashboardMetrics } from './types'

export type DataSource = 'fabric' | 'graph' | 'mock'

interface UseFabricDataOptions {
  autoCheck?: boolean
  preferredSource?: DataSource
}

interface UseFabricDataReturn {
  isAvailable: boolean | null
  isLoading: boolean
  error: string | null
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  
  // Opportunity functions
  opportunities: DetectedOpportunity[]
  fetchOpportunities: (params?: {
    fromDate?: Date
    toDate?: Date
    searchText?: string
    limit?: number
  }) => Promise<DetectedOpportunity[]>
  
  // Dashboard functions
  dashboardMetrics: DashboardMetrics | null
  fetchDashboardMetrics: () => Promise<DashboardMetrics>
  
  // Search function
  search: (query: string) => Promise<{ opportunities: FabricOpportunity[] }>
}

/**
 * Hook to manage Fabric database data fetching
 * Provides a unified interface to fetch opportunities and metrics from Fabric SQL
 */
export function useFabricData(options: UseFabricDataOptions = {}): UseFabricDataReturn {
  const { autoCheck = true, preferredSource = 'fabric' } = options
  
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>(preferredSource)
  const [opportunities, setOpportunities] = useState<DetectedOpportunity[]>([])
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)

  // Check if the backend API is available
  useEffect(() => {
    if (!autoCheck) return
    
    const checkAvailability = async () => {
      try {
        const available = await fabricDatabaseService.checkHealth()
        setIsAvailable(available)
        
        // Automatically fall back to mock data if Fabric isn't available
        if (!available && preferredSource === 'fabric') {
          console.warn('Fabric database not available, falling back to mock data')
          setDataSource('mock')
        }
      } catch (err) {
        console.error('Failed to check Fabric availability:', err)
        setIsAvailable(false)
        if (preferredSource === 'fabric') {
          setDataSource('mock')
        }
      }
    }
    
    checkAvailability()
  }, [autoCheck, preferredSource])

  /**
   * Fetch opportunities from the selected data source
   */
  const fetchOpportunities = useCallback(
    async (params?: {
      fromDate?: Date
      toDate?: Date
      searchText?: string
      limit?: number
    }): Promise<DetectedOpportunity[]> => {
      setIsLoading(true)
      setError(null)
      
      try {
        let result: DetectedOpportunity[] = []
        
        if (dataSource === 'fabric' && isAvailable) {
          result = await fetchOpportunitiesFromFabric(params)
        } else {
          // Fall back to existing mock/graph data
          // This will be handled by the existing detection service
          throw new Error('Fabric not available, use existing data source')
        }
        
        setOpportunities(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch opportunities'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [dataSource, isAvailable]
  )

  /**
   * Fetch dashboard metrics from the selected data source
   */
  const fetchDashboardMetrics = useCallback(async (): Promise<DashboardMetrics> => {
    setIsLoading(true)
    setError(null)
    
    try {
      let result: DashboardMetrics
      
      if (dataSource === 'fabric' && isAvailable) {
        result = await fetchDashboardMetricsFromFabric()
      } else {
        // Fall back to existing mock data
        throw new Error('Fabric not available, use existing data source')
      }
      
      setDashboardMetrics(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [dataSource, isAvailable])

  /**
   * Search opportunities and referrals
   */
  const search = useCallback(
    async (query: string): Promise<{ opportunities: FabricOpportunity[] }> => {
      if (!isAvailable) {
        throw new Error('Fabric database not available')
      }
      
      return fabricDatabaseService.search(query)
    },
    [isAvailable]
  )

  return {
    isAvailable,
    isLoading,
    error,
    dataSource,
    setDataSource,
    opportunities,
    fetchOpportunities,
    dashboardMetrics,
    fetchDashboardMetrics,
    search,
  }
}
