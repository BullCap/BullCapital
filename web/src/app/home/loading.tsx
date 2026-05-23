import AppShell from '@/components/navigation/AppShell'
import { PageLoadingContent } from '@/components/navigation/PageLoadingContent'

export default function HomeLoading() {
  return (
    <AppShell active="market">
      <PageLoadingContent />
    </AppShell>
  )
}
