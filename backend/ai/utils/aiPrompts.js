export function studentTipPrompt(studentName, loadData) {
  const formattedData = loadData
    .map(d => `- ${d.date}: ${d.load_score}% load (${d.deadlines_count} deadlines, ${d.risk_level} level)`)
    .join('\n');

  return `Student: ${studentName}

Their upcoming workload:
${formattedData}

Provide:
1. Brief analysis of their situation (2 sentences max)
2. One specific, actionable tip to manage this workload
3. Brief encouragement

Keep it under 100 words, friendly and supportive tone.`;
}
export function professorSuggestionPrompt(courseName, overloadDays, deadlines, conflicts) {
  const overloadInfo = overloadDays
    .map(d => `- ${d.date}: ${d.average_load}% average class load`)
    .join('\n');

  const deadlineInfo = deadlines
    .map(d => `- ${d.title} (${d.type}, difficulty ${d.difficulty}) on ${new Date(d.deadline_date).toISOString().split('T')[0]}`)
    .join('\n');

  const conflictInfo = conflicts.length > 0
    ? `\nConflicts detected:\n${conflicts.map(c => `- ${c.date}: ${c.count} deadlines (${c.severity} severity)`).join('\n')}`
    : '';

  return `Course: ${courseName}

Overloaded periods:
${overloadInfo}

Current deadlines:
${deadlineInfo}
${conflictInfo}

Suggest:
1. Which deadline(s) should be rescheduled
2. Better alternative dates
3. Brief justification

Keep it professional, under 120 words.`;
}
export function conflictWarningPrompt(conflict) {
  const deadlineList = conflict.deadlines
    .map(d => `- ${d.title} (${d.type}, difficulty ${d.difficulty})`)
    .join('\n');

  return `Multiple deadlines on ${conflict.date}:
${deadlineList}

Severity: ${conflict.severity}

Explain why this is problematic and suggest action in 2-3 sentences.`;
}