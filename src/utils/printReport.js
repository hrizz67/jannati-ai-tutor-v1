export function printParentReport(reportId = 'parent-print-report') {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.print !== 'function') return false;
  const report = document.getElementById(reportId);
  if (!report || report.querySelector('input[type="password"], [data-sensitive="true"]')) return false;
  window.print();
  return true;
}

export default {
  printParentReport
};
