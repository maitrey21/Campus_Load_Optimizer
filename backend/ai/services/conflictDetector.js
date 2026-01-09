class ConflictDetector {
  /**
   * Detect deadline conflicts
   */
  detectConflicts(deadlines) {
    // Group deadlines by date
    const deadlinesByDate = this.groupByDate(deadlines);
    
    const conflicts = [];

    for (const [date, items] of Object.entries(deadlinesByDate)) {
      if (items.length > 1) {
        conflicts.push({
          date,
          count: items.length,
          deadlines: items.map(d => ({
            id: d._id,
            title: d.title,
            type: d.type,
            difficulty: d.difficulty,
            course_name: d.course_name
          })),
          severity: this.calculateSeverity(items),
          total_difficulty: items.reduce((sum, d) => sum + d.difficulty, 0)
        });
      }
    }

    return conflicts.sort((a, b) => b.total_difficulty - a.total_difficulty);
  }

  /**
   * Group deadlines by date
   */
  groupByDate(deadlines) {
    const grouped = {};

    deadlines.forEach(deadline => {
      const date = new Date(deadline.deadline_date).toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(deadline);
    });

    return grouped;
  }

  /**
   * Calculate conflict severity
   */
  calculateSeverity(deadlines) {
    const count = deadlines.length;
    const hasExam = deadlines.some(d => d.type === 'exam');
    const avgDifficulty = deadlines.reduce((sum, d) => sum + d.difficulty, 0) / count;

    if (hasExam && count >= 2) return 'critical';
    if (count >= 3) return 'high';
    if (avgDifficulty >= 4) return 'high';
    return 'medium';
  }

  /**
   * Suggest better dates for conflicting deadlines
   */
  suggestAlternativeDates(conflict, allDeadlines, daysRange = 14) {
    const conflictDate = new Date(conflict.date);
    const suggestions = [];

    // Check ±7 days around the conflict
    for (let offset = -daysRange/2; offset <= daysRange/2; offset++) {
      if (offset === 0) continue; // Skip the conflict date itself

      const alternativeDate = new Date(conflictDate);
      alternativeDate.setDate(alternativeDate.getDate() + offset);
      const altDateStr = alternativeDate.toISOString().split('T')[0];

      // Count deadlines on this alternative date
      const deadlinesOnAltDate = allDeadlines.filter(d => 
        new Date(d.deadline_date).toISOString().split('T')[0] === altDateStr
      );

      suggestions.push({
        date: altDateStr,
        existing_deadlines: deadlinesOnAltDate.length,
        days_from_conflict: offset,
        suitability_score: this.calculateSuitability(deadlinesOnAltDate.length, Math.abs(offset))
      });
    }

    // Return top 3 best alternatives
    return suggestions
      .sort((a, b) => b.suitability_score - a.suitability_score)
      .slice(0, 3);
  }

  /**
   * Calculate how suitable a date is (lower existing deadlines + closer to original = better)
   */
  calculateSuitability(existingDeadlines, daysAway) {
    const loadScore = Math.max(0, 10 - existingDeadlines * 3);
    const proximityScore = Math.max(0, 10 - daysAway);
    return loadScore + proximityScore;
  }
}

export default new ConflictDetector();