import AppShell from '@/components/navigation/AppShell'
import { PageLoadingContent } from '@/components/navigation/PageLoadingContent'

export default function AnalysisLoading() {
  return (
    <AppShell active="analysis" skipUserLookup>
      <PageLoadingContent />
    </AppShell>
  )
}
