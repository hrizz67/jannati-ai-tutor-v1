import { getTutorResponse as getLocalTutorResponse } from '../ai/tutorResponseEngine.js';
import {
  applyLocalFirstDialogueRoute,
  buildBoundedDialogueContext,
  classifyLocalFirstDialogue
} from '../ai/conversation/localFirstConversationRouter.js';

export async function getTutorResponse(options = {}) {
  const boundedOptions = {
    ...options,
    history: buildBoundedDialogueContext(options.history)
  };
  const localResponse = await getLocalTutorResponse(boundedOptions);
  const decision = classifyLocalFirstDialogue({
    prompt: boundedOptions.prompt,
    history: boundedOptions.history,
    studentTurn: localResponse?.studentTurn,
    localResponse
  });
  return applyLocalFirstDialogueRoute(localResponse, decision, boundedOptions);
}

export default {
  getTutorResponse
};
