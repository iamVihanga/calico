import { hasSinhala, nfc, splitScriptRuns } from '../sinhala';

describe('sinhala', () => {
  it('detects Sinhala', () => {
    expect(hasSinhala('Madol Doova')).toBe(false);
    expect(hasSinhala('මඩොල් දූව')).toBe(true);
  });

  it('keeps a multi-word Sinhala title in one run', () => {
    expect(splitScriptRuns('මඩොල් දූව')).toEqual([{ text: 'මඩොල් දූව', sinhala: true }]);
  });

  it('splits mixed strings so Latin keeps its family', () => {
    expect(splitScriptRuns('මඩොල් දූව is due in 3 days')).toEqual([
      { text: 'මඩොල් දූව', sinhala: true },
      { text: ' is due in 3 days', sinhala: false },
    ]);
    expect(splitScriptRuns('Due: හත් පණ.')).toEqual([
      { text: 'Due: ', sinhala: false },
      { text: 'හත් පණ', sinhala: true },
      { text: '.', sinhala: false },
    ]);
  });

  it('keeps ZWJ conjuncts inside the run and survives NFC round trips', () => {
    const name = 'මාර්ටින් වික්‍රමසිංහ';
    expect(name).toContain('‍');
    const runs = splitScriptRuns(name);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.text).toBe(name);
    expect(nfc(nfc(name))).toBe(nfc(name));
    expect(nfc(name)).toContain('‍');
  });

  it('joins runs back to the input', () => {
    const s = 'A/අ · IT · ගම්පෙරළිය 1960';
    expect(
      splitScriptRuns(s)
        .map((r) => r.text)
        .join(''),
    ).toBe(s);
  });
});
