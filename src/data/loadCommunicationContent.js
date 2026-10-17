const importCommunicationContent = () => import('./communicationContent.js');

export function createCommunicationContentLoader(importModule = importCommunicationContent) {
  let contentPromise;
  return {
    load() {
      contentPromise ||= Promise.resolve().then(() => importModule());
      return contentPromise;
    }
  };
}

const communicationContentLoader = createCommunicationContentLoader();

export function loadCommunicationContent() {
  return communicationContentLoader.load();
}
