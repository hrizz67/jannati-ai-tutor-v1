import React from 'react';
import { detectArabicScript, detectLatinScript } from '../ai/voice/languageDetector.js';
import { getSubjectLanguagePresentation } from '../ai/voice/voiceConfig.js';
import { splitQuestionPresentationLines } from '../utils/questionPresentation.js';

const ARABIC_RUN_PATTERN = /([\p{Script=Arabic}\p{Mark}\u0640]+(?:[\s\u00a0]+[\p{Script=Arabic}\p{Mark}\u0640]+)*)/gu;

export function getSubjectTextProps(text = '', subjectId = '', { teaching = false } = {}) {
  const presentation = getSubjectLanguagePresentation(subjectId);
  const value = String(text ?? '');
  const hasArabic = detectArabicScript(value);
  const hasLatin = detectLatinScript(value);

  if (hasArabic && !hasLatin) return { lang: 'ar', dir: 'rtl' };
  if (teaching || (hasArabic && hasLatin)) {
    return { lang: presentation.teachingLanguage, dir: presentation.teachingDirection };
  }
  return { lang: presentation.contentLanguage, dir: presentation.direction };
}

export default function SubjectLanguageText({
  text = '',
  subjectId = '',
  as: Component = 'span',
  teaching = false,
  className = '',
  ...props
}) {
  const value = String(text ?? '');
  const languageProps = getSubjectTextProps(value, subjectId, { teaching });
  const mixed = detectArabicScript(value) && detectLatinScript(value);
  const content = mixed
    ? value.split(ARABIC_RUN_PATTERN).filter(Boolean).map((part, index) => (
        detectArabicScript(part)
          ? <bdi className="arabic-text-inline" lang="ar" dir="rtl" key={`${index}-${part}`}>{part}</bdi>
          : <React.Fragment key={`${index}-${part}`}>{part}</React.Fragment>
      ))
    : value;

  return <Component {...props} {...languageProps} className={className || undefined}>{content}</Component>;
}

export function renderSubjectQuestionText(text = '', subjectId = '') {
  const value = String(text || '');
  const lines = splitQuestionPresentationLines(value);
  if (lines.length <= 1) return <SubjectLanguageText text={value} subjectId={subjectId} />;
  return <>{lines.map((line, index) => (
    <React.Fragment key={`${index}-${line}`}>
      <SubjectLanguageText text={line} subjectId={subjectId} className={index ? 'uasa-question-example question-line' : 'question-line'} />
      {index < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ))}</>;
}
