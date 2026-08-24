export function printParentReport() {
  if (typeof window === 'undefined' || typeof window.print !== 'function') {
    return;
  }
  window.print();
}

export default {
  printParentReport
};
