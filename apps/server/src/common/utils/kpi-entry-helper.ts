import type { KpiEntryWithReview, KpiFormResponses } from '@workspace/types/types';
import { KpiStatus } from '@workspace/types/enums';

export function convertEntriesToReviewStructure(entries: Record<string, unknown>[]): KpiEntryWithReview[] {
  return entries.map((entry, index) => ({
    entry_id: `entry_${index + 1}`,
    data: entry,
    status: KpiStatus.PENDING,
  }));
}

export function ensureEntriesWithReviewStructure(formResponses: KpiFormResponses): KpiFormResponses {
  if (!formResponses) {
    return { entries: [], entries_with_review: [] };
  }

  const entries = formResponses.entries || [];
  const entriesWithReview = formResponses.entries_with_review || [];

  if (entries.length > 0 && entriesWithReview.length === 0) {
    const newEntriesWithReview = convertEntriesToReviewStructure(entries);
    return {
      ...formResponses,
      entries,
      entries_with_review: newEntriesWithReview,
    };
  }

  return {
    ...formResponses,
    entries,
    entries_with_review: entriesWithReview,
  };
}

export function mergeEntriesForReview(
  hodEntries: Record<string, unknown>[] = [],
  coordinatorEntries: Record<string, unknown>[] = [],
): KpiEntryWithReview[] {
  const allEntries = [...hodEntries, ...coordinatorEntries];
  return convertEntriesToReviewStructure(allEntries);
}
