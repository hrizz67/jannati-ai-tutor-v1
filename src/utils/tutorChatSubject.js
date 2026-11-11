/**
 * Resolve Tutor context from the screen owning the subject selection.
 * Dashboard selection must not inherit the subject of a previous quiz.
 */
export function resolveTutorChatSubject({
  screen = '',
  selectedSubjectId = '',
  selectedSubject = null,
  activeSubject = null,
  allSubjects = [],
  tutorSubjectId = ''
} = {}) {
  if (screen === 'dashboard') {
    if (!selectedSubjectId) return null;
    if (selectedSubject?.id === selectedSubjectId) return selectedSubject;
    return (Array.isArray(allSubjects) ? allSubjects : [])
      .find(subject => subject?.id === selectedSubjectId) || null;
  }

  if (activeSubject?.id === 'adaptive') {
    return (Array.isArray(allSubjects) ? allSubjects : [])
      .find(subject => subject?.id === tutorSubjectId) || selectedSubject || activeSubject;
  }
  return activeSubject || selectedSubject || null;
}
