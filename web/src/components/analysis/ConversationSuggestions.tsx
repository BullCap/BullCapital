interface ConversationSuggestionsProps {
  suggestions: string[]
  onSelect: (s: string) => void
  disabled: boolean
}

export function ConversationSuggestions({
  suggestions,
  onSelect,
  disabled,
}: ConversationSuggestionsProps) {
  if (!suggestions.length) return null

  return (
    <div className="bull-scroll flex gap-2 overflow-x-auto pb-1">
      {suggestions.map((s, i) => (
        <button
          key={`${s}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          className="bull-suggestion-pill shrink-0 transition hover:border-white/25 hover:text-[#F4F0FF] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
