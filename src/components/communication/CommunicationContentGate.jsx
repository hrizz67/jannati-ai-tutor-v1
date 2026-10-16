import { use } from 'react';
import { loadCommunicationContent } from '../../data/loadCommunicationContent.js';

export default function CommunicationContentGate({ children }) {
  return children(use(loadCommunicationContent()));
}
