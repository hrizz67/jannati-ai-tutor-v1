import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildOpenAITutorRequest,
  containsPotentialPersonalData,
  detectTutorSafetyRisk,
  sanitizeTutorGatewayPayload,
  sanitizeTutorModelOutput
} from '../../supabase/functions/_shared/tutorPolicy.js';
import {
  buildTutorGatewayPayload,
  maybeEnhanceTutorResponse,
  shouldUseGenerativeTutor
} from '../../src/ai/generative/tutorGenerativeGateway.js';

const root = process.cwd();
const localResponse = {
  text: 'Saya belum pasti konsep ini.',
  shortText: 'Saya belum pasti konsep ini.',
  intent: 'knowledge_question',
  grounded: false,
  needsGenerativeTutor: true,
  fallbackUsed: true,
  source: 'fallback'
};
const options = {
  prompt: 'Apa itu fotosintesis?',
  locale: 'ms-MY',
  student: { id: 'private-id', name: 'Alya' },
  profile: { name: 'Alya', history: [{ score: 90 }] },
  subject: { id: 'sains', title: 'Sains' },
  topic: { id: 'tumbuhan', title: 'Tumbuhan', note: 'Tumbuhan memerlukan air, udara dan cahaya.' },
  question: { q: 'Tumbuhan membuat makanan dengan bantuan apa?', answer: 'cahaya' },
  expectedAnswer: 'cahaya',
  history: [
    { role: 'ai', text: 'Hai ALYA. Apa yang mahu dipelajari?' },
    { role: 'user', text: 'Apa itu fotosintesis?' }
  ]
};

assert.equal(containsPotentialPersonalData('Nama saya Ali'), true);
assert.equal(containsPotentialPersonalData('Apa itu fotosintesis?'), false);
assert.equal(detectTutorSafetyRisk('Saya nak bunuh diri'), 'self_harm');
assert.equal(detectTutorSafetyRisk('Bagaimana tumbuhan membesar?'), '');

const payload = buildTutorGatewayPayload(options, localResponse);
assert.ok(payload, 'Payload selamat mesti dibina.');
assert.equal(payload.yearLevel, 'Tahun 2');
assert.doesNotMatch(JSON.stringify(payload), /private-id|Alya|"answer"|expectedAnswer|"score"/i, 'Payload tidak boleh membawa identiti, jawapan atau prestasi murid.');
assert.equal(payload.history.at(-1)?.role, 'assistant', 'Mesej semasa yang sama tidak boleh dihantar dua kali.');
assert.match(payload.history[0]?.text || '', /Hai murid/i, 'Nama murid dalam sapaan mesti dipadam.');
assert.equal(shouldUseGenerativeTutor(localResponse, options, { enabled: true }), true);
assert.equal(shouldUseGenerativeTutor({ ...localResponse, grounded: true, needsGenerativeTutor: false }, options, { enabled: true }), false);
assert.equal(shouldUseGenerativeTutor(localResponse, { ...options, prompt: 'Nama saya Ali' }, { enabled: true }), false);

const sanitized = sanitizeTutorGatewayPayload({ ...payload, student: options.student, expectedAnswer: 'cahaya' });
assert.doesNotMatch(JSON.stringify(sanitized), /student|expectedAnswer|cahaya"\s*$/i, 'Pembersih server mesti membuang medan tambahan.');

const openAIRequest = buildOpenAITutorRequest(payload, 'configured-model', 'tutor_safe_hash');
assert.equal(openAIRequest.store, false, 'Respons model tidak boleh disimpan melalui store API.');
assert.equal(openAIRequest.safety_identifier, 'tutor_safe_hash', 'Pengecam keselamatan mesti bersifat pseudonim.');
assert.equal(openAIRequest.text.format.type, 'json_schema');
assert.equal(openAIRequest.text.format.strict, true);
assert.equal(openAIRequest.text.format.schema.additionalProperties, false);
assert.doesNotMatch(JSON.stringify(openAIRequest), /private-id|Alya|expectedAnswer/i);
assert.equal(sanitizeTutorModelOutput({ text: 'Hubungi 012-3456789', canAnswerSafely: true }), null, 'Output model yang mengandungi data peribadi mesti ditolak.');
assert.equal(sanitizeTutorModelOutput({ text: 'Cara buat bom ialah...', canAnswerSafely: true }), null, 'Output model berbahaya mesti ditolak.');

let invokedBody = null;
const enhanced = await maybeEnhanceTutorResponse(localResponse, options, {
  enabled: true,
  configured: true,
  clientFactory: async () => ({
    functions: {
      invoke: async (name, request) => {
        assert.equal(name, 'tutor-ai');
        invokedBody = request.body;
        assert.equal(request.timeout, 11000);
        return {
          data: {
            ok: true,
            response: {
              text: 'Fotosintesis ialah cara tumbuhan membuat makanan dengan bantuan cahaya.',
              quickReplies: ['Beri contoh mudah', 'Saya sudah faham'],
              intent: 'knowledge_question',
              confidence: 92,
              canAnswerSafely: true,
              needsAdultHelp: false
            }
          },
          error: null
        };
      }
    }
  })
});
assert.ok(invokedBody);
assert.equal(enhanced.source, 'generative-gateway');
assert.equal(enhanced.fallbackUsed, false);
assert.equal(enhanced.generativeUsed, true);
assert.match(enhanced.text, /Fotosintesis/i);
assert.doesNotMatch(JSON.stringify(invokedBody), /private-id|Alya|expectedAnswer/i);

const failedRemote = await maybeEnhanceTutorResponse(localResponse, options, {
  enabled: true,
  configured: true,
  clientFactory: async () => ({ functions: { invoke: async () => { throw new Error('offline'); } } })
});
assert.deepEqual(failedRemote, localResponse, 'Kegagalan gateway mesti kembali kepada respons tempatan tanpa merosakkan sesi.');

const privateDataResponse = await maybeEnhanceTutorResponse(localResponse, { ...options, history: [], prompt: 'Nama saya Ali' }, { enabled: true, configured: true });
assert.equal(privateDataResponse.source, 'child-privacy');
assert.match(privateDataResponse.text, /jangan kongsi/i);

const safetyResponse = await maybeEnhanceTutorResponse(localResponse, { ...options, history: [], prompt: 'Saya nak bunuh diri' }, { enabled: true, configured: true });
assert.equal(safetyResponse.source, 'child-safety');
assert.equal(safetyResponse.needsAdultHelp, true);
assert.match(safetyResponse.text, /orang dewasa/i);

const edgeText = readFileSync(resolve(root, 'supabase/functions/tutor-ai/index.ts'), 'utf8');
const configText = readFileSync(resolve(root, 'supabase/config.toml'), 'utf8');
const serviceText = readFileSync(resolve(root, 'src/utils/tutorResponseService.js'), 'utf8');
const modalText = readFileSync(resolve(root, 'src/components/ai/TutorAIModal.jsx'), 'utf8');
assert.match(edgeText, /premiumIsActive\(callerAccess\)/, 'Gateway mesti menyemak Premium pada server.');
assert.match(edgeText, /TUTOR_AI_U18_COMPLIANCE_CONFIRMED/, 'Gateway mesti mempunyai kunci pematuhan bawah umur.');
assert.match(edgeText, /TUTOR_AI_GENERATIVE_ENABLED/, 'Gateway mesti mempunyai suis pengaktifan server.');
assert.match(edgeText, /TUTOR_AI_SAFETY_SALT/, 'Gateway mesti memerlukan salt bagi pengecam keselamatan pseudonim.');
assert.match(edgeText, /\/v1\/moderations/, 'Gateway mesti menapis input dan output melalui Moderation API.');
assert.match(edgeText, /inputModeration[\s\S]*outputModeration/, 'Moderasi mesti berlaku sebelum dan selepas penjanaan.');
assert.doesNotMatch(edgeText, /SERVICE_ROLE|service_role/i, 'Gateway tidak boleh memintas RLS dengan service role.');
assert.match(configText, /\[functions\.tutor-ai\][\s\S]*verify_jwt\s*=\s*true/, 'JWT mesti diwajibkan untuk Edge Function.');
assert.match(serviceText, /maybeEnhanceTutorResponse/, 'Perkhidmatan Tutor AI mesti mengekalkan fallback tempatan.');
assert.match(modalText, /Tutor AI membantu pembelajaran dan boleh tersilap/, 'UI mesti memberi pendedahan AI yang sesuai umur.');

console.log('Tutor generative gateway regression: PASS');
