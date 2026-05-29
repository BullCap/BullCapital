import AppShell from '@/components/navigation/AppShell'
import { PageLoadingContent } from '@/components/navigation/PageLoadingContent'

export default function SearchLoading() {
  return (
    <AppShell active="search" skipUserLookup>
      <PageLoadingContent />
    </AppShell>
  )
}
