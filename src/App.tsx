import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'
import { 
  ChartBar, MagnifyingGlass, Clock, Sparkle, CheckCircle 
} from '@phosphor-icons/react'
import { DashboardView } from '@/components/DashboardView'
import { ScanView } from '@/components/ScanView'
import { ScanProgress } from '@/components/ScanProgress'
import { OpportunityCard } from '@/components/OpportunityCard'
import { OpportunityDialog } from '@/components/OpportunityDialog'
import { generateDashboardMetrics, simulateAIScan } from '@/lib/mockData'
import type { DetectedOpportunity, CommunicationType, OpportunityStatus } from '@/lib/types'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isScanning, setIsScanning] = useState(false)
  const [scanStage, setScanStage] = useState('')
  const [scanProgress, setScanProgress] = useState(0)
  const [opportunities, setOpportunities] = useKV<DetectedOpportunity[]>('opportunities', [])
  const [selectedOpportunity, setSelectedOpportunity] = useState<DetectedOpportunity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const dashboardMetrics = generateDashboardMetrics()
  
  const handleStartScan = async (config: {
    dateRange: { from: Date; to: Date }
    sources: CommunicationType[]
    keywords: string[]
  }) => {
    setIsScanning(true)
    setActiveTab('results')
    
    try {
      const results = await simulateAIScan(
        config.sources,
        config.keywords,
        (stage, progress) => {
          setScanStage(stage)
          setScanProgress(progress)
        }
      )
      
      setOpportunities((current) => {
        const currentOpps = current || []
        const newOpps = results.filter(
          newOpp => !currentOpps.some(existing => existing.id === newOpp.id)
        )
        return [...currentOpps, ...newOpps]
      })
      
      toast.success('Scan completed!', {
        description: `Found ${results.length} potential co-sell opportunities`
      })
    } catch (error) {
      toast.error('Scan failed', {
        description: 'Please try again or adjust your scan settings'
      })
    } finally {
      setIsScanning(false)
    }
  }
  
  const handleReview = (id: string) => {
    const opp = opportunities?.find(o => o.id === id)
    if (opp) {
      setSelectedOpportunity(opp)
      setDialogOpen(true)
    }
  }
  
  const handleConfirm = (id: string, editedSummary?: string) => {
    setOpportunities((current) =>
      (current || []).map(opp =>
        opp.id === id
          ? { 
              ...opp, 
              status: 'confirmed' as OpportunityStatus,
              summary: editedSummary || opp.summary,
              updatedAt: new Date().toISOString()
            }
          : opp
      )
    )
    
    setTimeout(() => {
      setOpportunities((current) =>
        (current || []).map(opp =>
          opp.id === id
            ? { ...opp, status: 'synced' as OpportunityStatus }
            : opp
        )
      )
      toast.success('Synced to CRM!', {
        description: 'Opportunity has been created/updated in Dynamics 365'
      })
    }, 1500)
    
    toast.success('Opportunity confirmed', {
      description: 'Syncing to Dynamics 365...'
    })
  }
  
  const handleReject = (id: string) => {
    setOpportunities((current) =>
      (current || []).map(opp =>
        opp.id === id
          ? { ...opp, status: 'rejected' as OpportunityStatus }
          : opp
      )
    )
    toast.info('Opportunity rejected', {
      description: 'This opportunity will not be synced to CRM'
    })
  }
  
  const handleBatchConfirm = () => {
    if (selectedIds.length === 0) return
    
    setOpportunities((current) =>
      (current || []).map(opp =>
        selectedIds.includes(opp.id)
          ? { ...opp, status: 'confirmed' as OpportunityStatus }
          : opp
      )
    )
    
    setTimeout(() => {
      setOpportunities((current) =>
        (current || []).map(opp =>
          selectedIds.includes(opp.id)
            ? { ...opp, status: 'synced' as OpportunityStatus }
            : opp
        )
      )
      toast.success('All confirmed opportunities synced!', {
        description: `${selectedIds.length} opportunities updated in Dynamics 365`
      })
      setSelectedIds([])
    }, 2000)
    
    toast.success(`Confirmed ${selectedIds.length} opportunities`, {
      description: 'Syncing to Dynamics 365...'
    })
  }
  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }
  
  const newOpportunities = (opportunities || []).filter(o => o.status === 'new')
  const reviewOpportunities = (opportunities || []).filter(o => o.status === 'review')
  const confirmedOpportunities = (opportunities || []).filter(o => o.status === 'confirmed' || o.status === 'synced')
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Sparkle size={24} weight="duotone" className="text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold">M365 Co-Sell Intelligence</h1>
                <p className="text-xs text-muted-foreground">
                  AI-Powered Partner Opportunity Detection
                </p>
              </div>
            </div>
            
            {opportunities && opportunities.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold">{opportunities.length}</p>
                  <p className="text-xs text-muted-foreground">Total Detected</p>
                </div>
                {newOpportunities.length > 0 && (
                  <Badge className="bg-accent text-accent-foreground">
                    {newOpportunities.length} New
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ChartBar size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <MagnifyingGlass size={16} />
              Scan
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Clock size={16} />
              Results
              {newOpportunities.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {newOpportunities.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <DashboardView metrics={dashboardMetrics} />
          </TabsContent>
          
          <TabsContent value="scan">
            <ScanView onStartScan={handleStartScan} isScanning={isScanning} />
          </TabsContent>
          
          <TabsContent value="results">
            {isScanning ? (
              <ScanProgress stage={scanStage} progress={scanProgress} />
            ) : !opportunities || opportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MagnifyingGlass size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No opportunities detected yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run a scan to detect co-sell opportunities in your communications
                </p>
                <Button onClick={() => setActiveTab('scan')}>
                  <MagnifyingGlass size={16} />
                  Start Your First Scan
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {newOpportunities.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold">New Opportunities</h2>
                        <p className="text-sm text-muted-foreground">
                          Review and confirm these detected co-sell opportunities
                        </p>
                      </div>
                      {selectedIds.length > 0 && (
                        <Button onClick={handleBatchConfirm}>
                          <CheckCircle size={16} />
                          Confirm {selectedIds.length} Selected
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {newOpportunities.map(opp => (
                        <OpportunityCard
                          key={opp.id}
                          opportunity={opp}
                          onReview={handleReview}
                          onConfirm={handleConfirm}
                          onReject={handleReject}
                          isSelected={selectedIds.includes(opp.id)}
                          onSelect={toggleSelection}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {confirmedOpportunities.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Confirmed & Synced</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {confirmedOpportunities.map(opp => (
                        <OpportunityCard
                          key={opp.id}
                          opportunity={opp}
                          onReview={handleReview}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <OpportunityDialog
        opportunity={selectedOpportunity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
      
      <Toaster position="top-right" />
    </div>
  )
}

export default App
