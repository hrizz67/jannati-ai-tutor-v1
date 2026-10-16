let communicationContentPromise;

export function loadCommunicationContent() {
  communicationContentPromise ||= import('./communicationContent.js');
  return communicationContentPromise;
}
