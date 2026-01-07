import styles from './RuleCheckResults.module.css';

export function RuleCheckResults({ results }: RuleCheckResultsProps) {

  if (!results) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.emptyState}>
          <p>No results to display</p>
        </div>
      </div>
    );
  }

  const { matches = [], unmatchedRuleIds = [], sections = [], rules = [] } = results;


  const renderTable = (content: { headers?: (string | null)[]; data?: string[][] }) => {
    if (!content.headers || !content.data) return null;

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.contentTable}>
          <thead>
            <tr>
              {content.headers.map((header, i) => (
                <th key={i}>{header || ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.resultsContainer}>
      <header className={styles.header}>
        <h2>Rule Check Results</h2>
      </header>

      {/* Summary Section */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Matches</span>
            <span className={styles.summaryValue}>{matches.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Matched Sections</span>
            <span className={styles.summaryValue}>{sections.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Applied Rules</span>
            <span className={styles.summaryValue}>
              {rules.length - unmatchedRuleIds.length}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Unmatched Rules</span>
            <span className={styles.summaryValue}>{unmatchedRuleIds.length}</span>
          </div>
        </div>
      </div>

      {/* Matched Sections */}
      {matches.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Matched Sections ({matches.length})
          </h3>
          
          {matches.map((match, index) => {
            const section = sections.find(s => s.id === match.sectionId);
            const matchedRules = rules.filter(r => 
              match.matchingRuleIds.includes(r.id)
            );

            if (!section) return null;

            return (
              <div key={index} className={styles.matchCard}>
                <div className={styles.matchHeader}>
                  <h4 className={styles.matchTitle}>
                    {section.title || `Section ${section.id}`}
                  </h4>
                  <span className={styles.badge}>Page {section.page}</span>
                </div>

                <div className={styles.sectionContent}>
                  <div className={styles.contentLabel}>Section Content:</div>
                  
                  {section.content.map((content, i) => {
                    if (content.type === 'text' && content.text) {
                      return (
                        <p key={i} className={styles.contentText}>
                          {content.text}
                        </p>
                      );
                    }
                    
                    if (content.type === 'table') {
                      return (
                        <div key={i}>
                          {renderTable(content)}
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>

                {matchedRules.length > 0 && (
                  <div className={styles.rulesSection}>
                    <div className={styles.rulesSectionHeader}>
                      <span className={styles.rulesLabel}>
                        Matching Rules
                      </span>
                      <span className={styles.ruleCount}>
                        {matchedRules.length} rule{matchedRules.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {matchedRules.map((rule, i) => (
                      <div key={i} className={styles.ruleCard}>
                        <div className={styles.ruleContent}>
                          <p className={styles.ruleText}>{rule.rule}</p>
                        </div>
                        
                        <div className={styles.ruleMetadata}>
                          <div className={styles.metadataItem}>
                            <span className={styles.metadataLabel}>Source:</span>
                            <span className={styles.metadataValue}>{rule.bron}</span>
                          </div>
                          
                          <div className={styles.ruleSizes}>
                            <span className={styles.sizeTag}>
                              Groot: <strong>{rule.groot}</strong>
                            </span>
                            <span className={styles.sizeTag}>
                              Midden: <strong>{rule.midden}</strong>
                            </span>
                            <span className={styles.sizeTag}>
                              Klein: <strong>{rule.klein}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {matchedRules.length === 0 && (
                  <div className={styles.noRulesMessage}>
                    <p>No rules matched this section</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Unmatched Rules */}
      {unmatchedRuleIds.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Unmatched Rules ({unmatchedRuleIds.length})
          </h3>
          <div className={styles.unmatchedContainer}>
            <p className={styles.unmatchedDescription}>
              The following rules did not match any sections in the document:
            </p>
            <div className={styles.unmatchedList}>
              {unmatchedRuleIds.map((ruleId, index) => {
                const rule = rules.find(r => r.id === ruleId);
                
                return (
                  <div key={index} className={styles.unmatchedCard}>
                    <div className={styles.unmatchedRule}>
                      {rule ? rule.rule : `Rule ID: ${ruleId}`}
                    </div>
                    {rule && (
                      <div className={styles.unmatchedMeta}>
                        <span className={styles.unmatchedSource}>
                          {rule.bron}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {matches.length === 0 && unmatchedRuleIds.length === 0 && (
        <div className={styles.emptyState}>
          <p>No matches or unmatched rules found</p>
        </div>
      )}
    </div>
  );
}