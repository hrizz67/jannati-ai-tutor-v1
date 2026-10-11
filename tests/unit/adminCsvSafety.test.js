import { describe, expect, it } from 'vitest';
import { buildAdminSubscriptionCsv } from '../../src/services/premiumEntitlement.js';

function csvFor(displayName, overrides = {}) {
  return buildAdminSubscriptionCsv([{
    email: 'parent@example.com',
    displayName,
    plan: 'premium',
    effectiveStatus: 'active',
    expiresAt: '2026-12-31T15:59:59.999Z',
    daysRemaining: 81,
    ...overrides
  }]);
}

describe('Admin CSV spreadsheet formula safety', () => {
  it.each([
    ['=SUM(A1:A2)', "'=SUM(A1:A2)"],
    ['+CMD', "'+CMD"],
    ['-1+2', "'-1+2"],
    ['@formula', "'@formula"],
    ['   +CMD', "'   +CMD"]
  ])('neutralizes a text cell beginning with %s', (value, expected) => {
    expect(csvFor(value)).toContain(expected);
  });

  it('neutralizes before quoting a comma-containing formula', () => {
    expect(csvFor('=SUM(A1,A2)')).toContain('"\'=SUM(A1,A2)"');
  });

  it('neutralizes before escaping a quote-containing formula', () => {
    expect(csvFor('@formula "quoted"')).toContain('"\'@formula ""quoted"""');
  });

  it('leaves a normal display name unchanged', () => {
    expect(csvFor('Aminah Abdullah')).toContain('parent@example.com,Aminah Abdullah,premium');
  });

  it('leaves a normal email unchanged', () => {
    expect(csvFor('Aminah Abdullah')).toContain('parent@example.com');
    expect(csvFor('Aminah Abdullah')).not.toContain("'parent@example.com");
  });

  it('keeps numeric values numeric even when negative', () => {
    const csv = csvFor('Aminah Abdullah', { daysRemaining: -2 });
    expect(csv.endsWith(',-2')).toBe(true);
    expect(csv).not.toContain(",'-2");
  });
});
