import { getTutorResponse as getLocalTutorResponse } from '../ai/index.js';
import { maybeEnhanceTutorResponse } from '../ai/generative/tutorGenerativeGateway.js';

export async function getTutorResponse(options = {}) {
  const localResponse = await getLocalTutorResponse(options);
  return maybeEnhanceTutorResponse(localResponse, options);
}

export default {
  getTutorResponse
};
