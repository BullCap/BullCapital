import AppShell from '@/components/navigation/AppShell'
import { PageLoadingContent } from '@/components/navigation/PageLoadingContent'

export default function TerminalLoading() {
  return (
    <AppShell active="terminal">
      <PageLoadingContent />
    </AppShell>
  )
}
