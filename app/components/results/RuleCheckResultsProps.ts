interface Match {
  sectionId: number;
  matchingRuleIds: string[];
}

interface Section {
  id: number;
  type: string;
  title: string | null;
  page: number;
  content: Array<{
    type: string;
    text?: string;
    headers?: (string | null)[];
    data?: string[][];
  }>;
}


interface CheckResults {
  matches: Match[];
  unmatchedRuleIds: string[];
  sections: Section[];
  rules: Rule[];
}

interface RuleCheckResultsProps {
  results: CheckResults;
}