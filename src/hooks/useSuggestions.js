import { useMemo } from 'react'
import { getDailyChallenge, getEmptyStateMessage, getSuggestionsForProfile } from '../lib/suggestions'
import { readQuiz } from '../lib/quiz'

export function useSuggestions(profileType) {
  const type = profileType || readQuiz()?.type || 'procrastinator'
  return useMemo(
    () => ({
      type,
      pack: getSuggestionsForProfile(type),
      empty: (section) => getEmptyStateMessage(section, type),
      challenge: getDailyChallenge(type),
    }),
    [type],
  )
}

export { getDailyChallenge, getEmptyStateMessage, getSuggestionsForProfile }
