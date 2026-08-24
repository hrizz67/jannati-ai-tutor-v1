function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const templates = {
  math: {
    addition: {
      id: 'math.addition.basic',
      subject: 'math',
      topic: 'addition',
      stem_templates: [
        '{{a}} + {{b}} = ________.',
        'Ali ada {{a}} buku. Ibu memberi {{b}} buku lagi. Berapakah jumlah buku Ali?',
        'Kira jumlah {{a}} dan {{b}}.',
        'Berapakah hasil tambah {{a}} + {{b}}?'
      ],
      context_templates: [
        'Tambah dua nombor ini: {{a}} dan {{b}}.',
        'Jumlahkan {{a}} dengan {{b}}.'
      ],
      generateVariables() {
        const a = randomInt(1, 99);
        const b = randomInt(1, 99);
        return { a, b };
      },
      answerFn(vars) {
        return Number(vars.a) + Number(vars.b);
      }
    }
  }
};

function render(template, vars) {
  return String(template || '').replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return vars[key] === undefined ? '' : String(vars[key]);
  });
}

function normalizeSubject(subject) {
  return String(subject || '').toLowerCase();
}

function normalizeTopic(topic) {
  const value = String(topic || '').toLowerCase();
  if (value === 'tambah') return 'addition';
  return value;
}

export function selectTemplate(subject, topic) {
  const subjectKey = normalizeSubject(subject);
  const topicKey = normalizeTopic(topic);
  const bucket = templates[subjectKey] || {};
  return bucket[topicKey] || null;
}

export function generateQuestion(template) {
  if (!template) throw new Error('Template not found');

  const vars = typeof template.generateVariables === 'function'
    ? template.generateVariables()
    : {};

  const stemTemplate = template.stem_templates[randomInt(0, template.stem_templates.length - 1)];
  const contextTemplate = template.context_templates[randomInt(0, template.context_templates.length - 1)];

  const stem = render(stemTemplate, vars);
  const context = render(contextTemplate, vars);
  const answer = typeof template.answerFn === 'function' ? template.answerFn(vars) : null;

  return {
    templateId: template.id,
    stem,
    context,
    answer,
    variables: vars
  };
}

export default {
  selectTemplate,
  generateQuestion
};
