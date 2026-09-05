import React, { useEffect, useId, useMemo, useState } from 'react';
import JannaAvatar from '../JannaAvatar.jsx';
import QuestionVisual from './QuestionVisual.jsx';
import {
  getInteractiveQuestionConfig,
  serializeDragDropResponse,
  serializeMatchingResponse,
  serializeMoneyResponse,
  serializeMultiSelectResponse,
  serializeOrderingResponse
} from '../../utils/interactiveQuestion.js';

function isLocked(feedback) {
  return ['correct', 'almost', 'wrong'].includes(feedback?.status);
}

function responseClass(feedback, selected) {
  if (!selected || !isLocked(feedback)) return selected ? 'selected' : '';
  return feedback.status === 'correct' ? 'correct' : 'wrong';
}

function ChoiceGrid({ config, value, onChange, feedback, visualMath = false }) {
  const locked = isLocked(feedback);
  return <div className={`interactive-choice-layout ${visualMath ? 'visual-math-layout' : ''}`}>
    {visualMath && <QuestionVisual visual={config.visual} />}
    <div className="interactive-choice-grid" role="radiogroup" aria-label={config.instruction}>
      {config.options.map((option, optionIndex) => {
        const selected = String(value) === String(option.value);
        return <button
          className={`interactive-choice ${responseClass(feedback, selected)}`}
          type="button"
          role="radio"
          aria-checked={selected}
          data-option-id={option.id}
          tabIndex={selected || (!value && optionIndex === 0) ? 0 : -1}
          disabled={locked}
          key={option.id}
          onClick={() => onChange(String(option.value))}
          onKeyDown={event => {
            if (['Enter', ' '].includes(event.key)) {
              event.preventDefault();
              onChange(String(option.value));
              return;
            }
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
            const nextIndex = (optionIndex + direction + config.options.length) % config.options.length;
            const nextOption = config.options[nextIndex];
            onChange(String(nextOption.value));
            event.currentTarget.parentElement?.querySelector(`[data-option-id="${nextOption.id}"]`)?.focus();
          }}
        >
          {option.visual && <QuestionVisual visual={option.visual} />}
          <span>{option.label}</span>
        </button>;
      })}
    </div>
  </div>;
}

function parseDragDropResponse(config, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  if (!normalizedValue) return {};
  const assignments = {};
  for (const zone of config.zones) {
    const zoneLabel = String(zone.responseLabel || zone.label).toLowerCase();
    const section = normalizedValue.split(';').find(part => part.trim().startsWith(`${zoneLabel}:`));
    if (!section) continue;
    const labels = section.split(':').slice(1).join(':').split(',').map(label => label.trim());
    for (const item of config.items) {
      const itemLabel = String(item.responseLabel || item.label).toLowerCase();
      if (labels.includes(itemLabel)) assignments[item.id] = zone.id;
    }
  }
  return assignments;
}

function DragDropQuestion({ config, value, onChange, feedback }) {
  const [assignments, setAssignments] = useState(() => parseDragDropResponse(config, value));
  const [selectedItemId, setSelectedItemId] = useState('');
  const locked = isLocked(feedback);

  useEffect(() => {
    if (!value) {
      setAssignments({});
      setSelectedItemId('');
    }
  }, [value]);

  function assignItem(itemId, zoneId) {
    if (locked || !itemId) return;
    const next = { ...assignments, [itemId]: zoneId };
    setAssignments(next);
    setSelectedItemId('');
    onChange(serializeDragDropResponse(config, next));
  }

  function handleDragStart(event, itemId) {
    if (locked) return;
    event.dataTransfer.setData('text/plain', itemId);
    event.dataTransfer.effectAllowed = 'move';
    setSelectedItemId(itemId);
  }

  const remaining = config.items.filter(item => !assignments[item.id]);
  const completed = Object.keys(assignments).length;

  return <div className="drag-drop-question">
    <section className="interactive-source-pool" aria-label="Pilihan belum dikelaskan">
      <div className="interactive-section-heading"><b>Pilihan</b><span>{remaining.length} belum diletakkan</span></div>
      <div className="interactive-token-list">
        {remaining.map(item => <button
          className={`interactive-token ${selectedItemId === item.id ? 'selected' : ''}`}
          type="button"
          draggable={!locked}
          aria-pressed={selectedItemId === item.id}
          disabled={locked}
          key={item.id}
          onDragStart={event => handleDragStart(event, item.id)}
          onClick={() => setSelectedItemId(current => current === item.id ? '' : item.id)}
        >
          {item.visual && <QuestionVisual visual={item.visual} />}
          <span>{item.label}</span>
        </button>)}
        {!remaining.length && <span className="interactive-pool-complete">Semua pilihan telah diletakkan.</span>}
      </div>
    </section>
    <div className="interactive-zone-grid">
      {config.zones.map(zone => {
        const placedItems = config.items.filter(item => assignments[item.id] === zone.id);
        return <section
          className="interactive-drop-zone"
          key={zone.id}
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            assignItem(event.dataTransfer.getData('text/plain'), zone.id);
          }}
        >
          <button
            className="interactive-zone-target"
            type="button"
            disabled={locked || !selectedItemId}
            onClick={() => assignItem(selectedItemId, zone.id)}
            aria-label={`Letakkan pilihan dalam ${zone.label}`}
          >{zone.label}</button>
          <div className="interactive-token-list placed" aria-label={`Pilihan dalam ${zone.label}`}>
            {placedItems.map(item => <button
              className={`interactive-token ${selectedItemId === item.id ? 'selected' : ''}`}
              type="button"
              draggable={!locked}
              aria-pressed={selectedItemId === item.id}
              disabled={locked}
              key={item.id}
              onDragStart={event => handleDragStart(event, item.id)}
              onClick={() => setSelectedItemId(current => current === item.id ? '' : item.id)}
            >
              {item.visual && <QuestionVisual visual={item.visual} />}
              <span>{item.label}</span>
            </button>)}
            {!placedItems.length && <span className="interactive-zone-empty">Letak di sini</span>}
          </div>
        </section>;
      })}
    </div>
    <p className="interactive-progress" aria-live="polite">{completed} daripada {config.items.length} pilihan telah diletakkan.</p>
  </div>;
}

function parseMatchingResponse(config, value) {
  const pairs = String(value || '').toLowerCase().split(',').map(pair => pair.trim()).filter(Boolean);
  const matches = {};
  for (const pair of pairs) {
    const [leftLabel, rightLabel] = pair.split('-').map(label => label.trim());
    const item = config.items.find(row => String(row.responseLabel || row.label).toLowerCase() === leftLabel);
    const target = config.targets.find(row => String(row.responseLabel || row.label).toLowerCase() === rightLabel);
    if (item && target) matches[item.id] = target.id;
  }
  return matches;
}

function MatchingQuestion({ config, value, onChange, feedback }) {
  const [matches, setMatches] = useState(() => parseMatchingResponse(config, value));
  const [selectedItemId, setSelectedItemId] = useState('');
  const locked = isLocked(feedback);

  useEffect(() => {
    if (!value) {
      setMatches({});
      setSelectedItemId('');
    }
  }, [value]);

  function matchTarget(targetId) {
    if (locked || !selectedItemId) return;
    const next = Object.fromEntries(Object.entries(matches).filter(([, assignedTarget]) => assignedTarget !== targetId));
    next[selectedItemId] = targetId;
    setMatches(next);
    setSelectedItemId('');
    onChange(serializeMatchingResponse(config, next));
  }

  const targetById = useMemo(() => new Map(config.targets.map(target => [target.id, target])), [config.targets]);
  return <div className="matching-question">
    <div className="matching-columns">
      <section aria-label={config.itemGroupLabel || 'Pilihan untuk dipadankan'}>
        <b className="interactive-column-title">{config.itemHeading || '1. Pilih satu kad'}</b>
        <div className="matching-list">
          {config.items.map(item => <button
            className={`matching-button ${selectedItemId === item.id ? 'selected' : ''} ${matches[item.id] ? 'matched' : ''}`}
            type="button"
            aria-pressed={selectedItemId === item.id}
            disabled={locked}
            key={item.id}
            onClick={() => setSelectedItemId(current => current === item.id ? '' : item.id)}
          >
            {item.visual && <QuestionVisual visual={item.visual} />}
            <span>{item.label}</span>
            {matches[item.id] && <small>→ {targetById.get(matches[item.id])?.label}</small>}
          </button>)}
        </div>
      </section>
      <section aria-label={config.targetGroupLabel || 'Padanan untuk dipilih'}>
        <b className="interactive-column-title">{config.targetHeading || '2. Pilih padanannya'}</b>
        <div className="matching-list">
          {config.targets.map(target => {
            const used = Object.values(matches).includes(target.id);
            return <button
              className={`matching-button target ${used ? 'matched' : ''}`}
              type="button"
              disabled={locked || !selectedItemId}
              key={target.id}
              onClick={() => matchTarget(target.id)}
            >{target.label}{used && <small>{config.matchedLabel || 'Sudah dipadankan'}</small>}</button>;
          })}
        </div>
      </section>
    </div>
    <p className="interactive-progress" aria-live="polite">{Object.keys(matches).length} daripada {config.items.length} padanan lengkap.</p>
  </div>;
}

function parseOrderingResponse(config, value) {
  const normalizedValue = String(value || '').toLowerCase();
  const positions = config.items.map(item => ({
    id: item.id,
    position: normalizedValue.indexOf(String(item.responseLabel || item.label).toLowerCase())
  }));
  return positions.every(item => item.position >= 0)
    ? positions.sort((left, right) => left.position - right.position).map(item => item.id)
    : config.items.map(item => item.id);
}

function OrderingQuestion({ config, value, onChange, feedback }) {
  const [order, setOrder] = useState(() => parseOrderingResponse(config, value));
  const locked = isLocked(feedback);

  useEffect(() => {
    if (!value) setOrder(config.items.map(item => item.id));
  }, [value, config.items]);

  const itemById = useMemo(() => new Map(config.items.map(item => [item.id, item])), [config.items]);

  function commit(next) {
    setOrder(next);
    onChange(serializeOrderingResponse(config, next));
  }

  function move(itemId, offset) {
    if (locked) return;
    const from = order.indexOf(itemId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    commit(next);
  }

  function dropBefore(draggedId, targetId) {
    if (locked || !draggedId || draggedId === targetId) return;
    const next = order.filter(id => id !== draggedId);
    next.splice(next.indexOf(targetId), 0, draggedId);
    commit(next);
  }

  return <div className="ordering-question">
    <ol className="ordering-list" aria-label="Susunan jawapan">
      {order.map((itemId, index) => {
        const item = itemById.get(itemId);
        return <li
          className="ordering-item"
          draggable={!locked}
          key={itemId}
          onDragStart={event => event.dataTransfer.setData('text/plain', itemId)}
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            dropBefore(event.dataTransfer.getData('text/plain'), itemId);
          }}
        >
          <span className="ordering-position" aria-hidden="true">{index + 1}</span>
          <b>{item?.label}</b>
          <span className="ordering-controls">
            <button type="button" className="secondary" disabled={locked || index === 0} onClick={() => move(itemId, -1)} aria-label={`Gerakkan ${item?.label} ke atas`}>↑</button>
            <button type="button" className="secondary" disabled={locked || index === order.length - 1} onClick={() => move(itemId, 1)} aria-label={`Gerakkan ${item?.label} ke bawah`}>↓</button>
          </span>
        </li>;
      })}
    </ol>
    <p className="interactive-response-preview" aria-live="polite"><span>{config.responsePreviewLabel || 'Susunan kamu'}:</span> {serializeOrderingResponse(config, order)}</p>
  </div>;
}

function FillBlankQuestion({ config, value, onChange, feedback }) {
  const locked = isLocked(feedback);
  const [before, after] = config.sentenceParts;
  return <div className="fill-blank-question">
    <p className="fill-blank-sentence">
      <span>{before}</span>
      <strong className={value ? 'filled' : ''} aria-live="polite">{value || '______'}</strong>
      <span>{after}</span>
    </p>
    <div className="fill-blank-options" role="radiogroup" aria-label="Pilihan untuk tempat kosong">
      {config.options.map((option, optionIndex) => {
        const selected = String(value) === String(option.value);
        return <button
          type="button"
          role="radio"
          aria-checked={selected}
          className={`fill-blank-option ${responseClass(feedback, selected)}`}
          data-blank-option-id={option.id}
          tabIndex={selected || (!value && optionIndex === 0) ? 0 : -1}
          disabled={locked}
          key={option.id}
          onClick={() => onChange(String(option.value))}
          onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
            const nextIndex = (optionIndex + direction + config.options.length) % config.options.length;
            const nextOption = config.options[nextIndex];
            onChange(String(nextOption.value));
            event.currentTarget.parentElement?.querySelector(`[data-blank-option-id="${nextOption.id}"]`)?.focus();
          }}
        >{option.label}</button>;
      })}
    </div>
  </div>;
}

function parseMultiSelectResponse(config, value) {
  const parts = String(value || '').split(/\s*(?:,|&|\bdan\b)\s*/i).map(part => part.trim().toLowerCase()).filter(Boolean);
  return (config.options || [])
    .filter(option => parts.includes(String(option.value ?? option.label).trim().toLowerCase()))
    .map(option => option.id);
}

function MultiSelectQuestion({ config, value, onChange, feedback }) {
  const [selectedIds, setSelectedIds] = useState(() => parseMultiSelectResponse(config, value));
  const locked = isLocked(feedback);

  useEffect(() => {
    setSelectedIds(parseMultiSelectResponse(config, value));
  }, [config, value]);

  function toggle(optionId) {
    if (locked) return;
    const selected = new Set(selectedIds);
    if (selected.has(optionId)) selected.delete(optionId);
    else selected.add(optionId);
    const next = config.options.filter(option => selected.has(option.id)).map(option => option.id);
    setSelectedIds(next);
    onChange(serializeMultiSelectResponse(config, next));
  }

  return <div className="multi-select-question">
    <div className="multi-select-grid" role="group" aria-label="Pilih semua jawapan yang benar">
      {config.options.map(option => {
        const selected = selectedIds.includes(option.id);
        const correctOption = config.correctOptionIds.includes(option.id);
        const optionState = !isLocked(feedback)
          ? (selected ? 'selected' : '')
          : selected && correctOption
            ? 'correct'
            : selected
              ? 'wrong'
              : feedback.status !== 'correct' && correctOption
                ? 'missed'
                : '';
        return <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          className={`multi-select-option ${optionState}`}
          disabled={locked}
          key={option.id}
          onClick={() => toggle(option.id)}
        >
          <span className="multi-select-check" aria-hidden="true">{selected ? '✓' : ''}</span>
          <span>{option.label}</span>
        </button>;
      })}
    </div>
    <p className="interactive-progress" aria-live="polite">{selectedIds.length} pernyataan dipilih.</p>
  </div>;
}

function HotspotQuestion({ config, value, onChange, feedback }) {
  const locked = isLocked(feedback);
  return <div className="hotspot-question">
    <div className="hotspot-stage">
      <QuestionVisual visual={config.visual} />
      {config.hotspots.map((hotspot, index) => {
        const selected = String(value) === String(hotspot.value);
        return <button
          type="button"
          className={`hotspot-button ${responseClass(feedback, selected)}`}
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          aria-label={`Pilih ${hotspot.label}`}
          aria-pressed={selected}
          disabled={locked}
          key={hotspot.id}
          onClick={() => onChange(String(hotspot.value))}
        >
          <span aria-hidden="true">{index + 1}</span>
          <small>{hotspot.label}</small>
        </button>;
      })}
    </div>
    <p className="interactive-progress" aria-live="polite">{value ? 'Satu bahagian dipilih.' : 'Belum ada bahagian dipilih.'}</p>
  </div>;
}

function countsFromMoneyValue(config, value) {
  const amount = String(value || '').match(/(\d+)(?:\.(\d{1,2}))?/);
  let remaining = amount ? (Number(amount[1]) * 100 + Number(String(amount[2] || '').padEnd(2, '0'))) : 0;
  const counts = {};
  for (const denomination of config.denominations || []) {
    const limit = Math.max(1, Number(denomination.maxCount) || 10);
    const count = Math.min(limit, Math.floor(remaining / denomination.valueSen));
    if (count) counts[denomination.id] = count;
    remaining -= count * denomination.valueSen;
  }
  return remaining === 0 ? counts : {};
}

function MoneyQuestion({ config, value, onChange, feedback }) {
  const [counts, setCounts] = useState(() => countsFromMoneyValue(config, value));
  const locked = isLocked(feedback);
  const totalSen = useMemo(() => config.denominations.reduce((total, denomination) => (
    total + (counts[denomination.id] || 0) * denomination.valueSen
  ), 0), [config.denominations, counts]);

  useEffect(() => {
    if (!value) setCounts({});
  }, [value]);

  function changeCount(denomination, offset) {
    if (locked) return;
    const current = counts[denomination.id] || 0;
    const nextCount = Math.max(0, Math.min(Number(denomination.maxCount) || 10, current + offset));
    if (nextCount === current) return;
    const next = { ...counts, [denomination.id]: nextCount };
    if (!nextCount) delete next[denomination.id];
    const nextTotal = config.denominations.reduce((total, row) => total + (next[row.id] || 0) * row.valueSen, 0);
    setCounts(next);
    onChange(serializeMoneyResponse(nextTotal));
  }

  return <div className="money-question">
    <div className="money-total-panel" aria-live="polite">
      <span>Jumlah kamu</span>
      <strong>{serializeMoneyResponse(totalSen) || 'RM 0.00'}</strong>
      <small>Sasaran: {config.targetSen} sen</small>
    </div>
    <div className="money-denomination-grid">
      {config.denominations.map(denomination => <section className="money-denomination" key={denomination.id}>
        <div className={`money-piece ${denomination.kind || 'coin'} ${denomination.color || ''}`} aria-label={denomination.label}>
          <span>{denomination.label}</span>
        </div>
        <div className="money-counter">
          <button type="button" className="secondary" disabled={locked || !(counts[denomination.id] > 0)} onClick={() => changeCount(denomination, -1)} aria-label={`Tolak ${denomination.label}`}>−</button>
          <strong aria-label={`${counts[denomination.id] || 0} keping ${denomination.label}`}>{counts[denomination.id] || 0}</strong>
          <button type="button" disabled={locked || counts[denomination.id] >= (denomination.maxCount || 10)} onClick={() => changeCount(denomination, 1)} aria-label={`Tambah ${denomination.label}`}>+</button>
        </div>
      </section>)}
    </div>
  </div>;
}

export default function InteractiveQuestionEngine({ question, value, onChange, feedback }) {
  const instructionId = useId();
  const helpId = useId();
  const config = getInteractiveQuestionConfig(question);
  if (!config) return null;
  const isEnglish = String(question?.id || '').startsWith('ENG-');

  let content = null;
  if (config.type === 'choice' || config.type === 'imageChoice') content = <ChoiceGrid config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'dragDrop') content = <DragDropQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'matching') content = <MatchingQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'ordering') content = <OrderingQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'visualMath') content = <ChoiceGrid config={config} value={value} onChange={onChange} feedback={feedback} visualMath />;
  if (config.type === 'fillBlank') content = <FillBlankQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'multiSelect') content = <MultiSelectQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'hotspot') content = <HotspotQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'clock') content = <ChoiceGrid config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'money') content = <MoneyQuestion config={config} value={value} onChange={onChange} feedback={feedback} />;
  if (config.type === 'measurement') content = <ChoiceGrid config={config} value={value} onChange={onChange} feedback={feedback} visualMath />;

  return <section className={`interactive-question-engine type-${config.type}`} aria-labelledby={instructionId} aria-describedby={helpId}>
    <div className="interactive-instruction"><JannaAvatar size={46} /><p id={instructionId}><small>{isEnglish ? 'Janna guides you' : 'Janna membimbing'}</small>{config.instruction}</p></div>
    {content}
    <p className="interactive-help" id={helpId}>{config.screenReaderInstruction || (isEnglish ? 'Use touch, mouse or keyboard.' : 'Boleh guna sentuhan, tetikus atau papan kekunci.')}</p>
  </section>;
}
