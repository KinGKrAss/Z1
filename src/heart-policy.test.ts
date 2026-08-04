import { describe, it, expect } from 'vitest';
import { canonicalizeHeartPolicy, DEFAULT_COMMENT, DEFAULT_ISSUER, DEFAULT_VERSION, DEFAULT_ALGORITHM } from './heart-policy';

describe('heart-policy', () => {
  it('canonicalizes policy by sorting keys alphabetically', () => {
    const policy: any = {
      userDirectedExpressions: true,
      heartLaw: true,
      enforcementLevel: 1,
      contentLevel: "intimacy",
      auditBypass: false,
      authority: "Lion",
      trustAnchor: "Z1"
    };

    const canonicalString = canonicalizeHeartPolicy(policy);
    
    // Check if the order is alphabetical
    const expectedObj = {
      auditBypass: false,
      authority: "Lion",
      contentLevel: "intimacy",
      enforcementLevel: 1,
      heartLaw: true,
      trustAnchor: "Z1",
      userDirectedExpressions: true
    };
    
    expect(canonicalString).toBe(JSON.stringify(expectedObj));
  });

  it('exports correct constants', () => {
    expect(DEFAULT_COMMENT).toContain('HeartPolicy-Metadaten');
    expect(DEFAULT_ISSUER).toBe('🦁 n ❤️');
    expect(DEFAULT_VERSION).toBe('1.0.0');
    expect(DEFAULT_ALGORITHM).toBe('RSA-SHA256');
  });
});
