import AppShell from '@/components/navigation/AppShell'
import { PageLoadingContent } from '@/components/navigation/PageLoadingContent'

export default function NewsLoading() {
  return (
    <AppShell active="news" skipUserLookup>
      <PageLoadingContent />
    </AppShell>
  )
}
