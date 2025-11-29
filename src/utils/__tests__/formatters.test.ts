import {
  formatNumberString,
  truncateTxid,
  formatSatsToBtc,
  sanitizeForBig,
} from '@/utils/formatters';

describe('truncateTxid', () => {
  const testCases = [
    { input: '', expected: '', name: 'empty string' },
    {
      input: undefined as unknown as string,
      expected: '',
      name: 'undefined input',
    },
    { input: 'abc123', expected: 'abc123', name: 'short string unchanged' },
    {
      input: 'abcdef1234567890abcdef1234567890',
      expected: 'abcdef12...34567890',
      name: 'long string with default length',
    },
    {
      input: 'abcdef1234567890abcdef1234567890',
      length: 4,
      expected: 'abcd...7890',
      name: 'long string with custom length',
    },
    {
      input: 'a'.repeat(19),
      expected: 'a'.repeat(19),
      name: 'string at threshold length',
    },
  ];

  testCases.forEach(({ input, length, expected, name }) => {
    it(`handles ${name}`, () => {
      expect(truncateTxid(input, length)).toBe(expected);
    });
  });
});

describe('formatNumberString', () => {
  const testCases = [
    { input: undefined, expected: 'N/A', name: 'undefined input' },
    { input: null, expected: 'N/A', name: 'null input' },
    { input: '123', expected: '123', name: 'small number' },
    { input: '1234', expected: '1,234', name: 'four-digit number' },
    { input: '1234567890', expected: '1,234,567,890', name: 'large number' },
    {
      input: '123456789012345',
      expected: '123,456,789,012,345',
      name: 'large number within precision',
    },
    { input: 'not-a-number', expected: 'N/A', name: 'invalid input' },
    {
      input: undefined,
      defaultDisplay: 'none',
      expected: 'none',
      name: 'custom default display',
    },
    { input: '0', expected: '0', name: 'zero' },
    {
      input: '-1234.56',
      expected: '-1,234.56',
      name: 'decimal and negative number',
    },
    {
      input: '1,234.56',
      expected: '1,234.56',
      name: 'US format with commas',
    },
    {
      input: '123.45',
      expected: '123.45',
      name: 'decimal format',
    },
  ];

  testCases.forEach(({ input, defaultDisplay, expected, name }) => {
    it(`handles ${name}`, () => {
      expect(formatNumberString(input, defaultDisplay)).toBe(expected);
    });
  });
});

describe('formatSatsToBtc', () => {
  const testCases = [
    { input: 0, expected: '0.00000000', name: 'zero satoshis' },
    { input: 1, expected: '0.00000001', name: 'one satoshi' },
    { input: 100000000, expected: '1.00000000', name: 'one BTC' },
    { input: 500809536, expected: '5.00809536', name: 'fractional BTC' },
    {
      input: 2100000000000000,
      expected: '21000000.00000000',
      name: 'max BTC supply',
    },
    { input: '100000000', expected: '1.00000000', name: 'string input' },
    { input: 99999999n, expected: '0.99999999', name: 'bigint input' },
    {
      input: '123.456',
      expected: '0.00000123',
      name: 'string with decimals (rounds down)',
    },
    {
      input: 123.9,
      expected: '0.00000123',
      name: 'float with decimals (rounds down)',
    },
  ];

  testCases.forEach(({ input, expected, name }) => {
    it(`handles ${name}`, () => {
      expect(formatSatsToBtc(input)).toBe(expected);
    });
  });
});

describe('sanitizeForBig', () => {
  const testCases = [
    { input: undefined, expected: '0', name: 'undefined input' },
    { input: null, expected: '0', name: 'null input' },
    { input: '', expected: '0', name: 'empty string' },
    { input: '   ', expected: '0', name: 'whitespace string' },
    { input: '123', expected: '123', name: 'simple number string' },
    { input: '123.45', expected: '123.45', name: 'decimal number' },
    { input: '1,234.56', expected: '1234.56', name: 'US format with comma' },
    {
      input: '1.234,56',
      expected: '1234.56',
      name: 'European format (dot as thousands, comma as decimal)',
    },
    { input: '-123.45', expected: '-123.45', name: 'negative number' },
    { input: '1,234,567.89', expected: '1234567.89', name: 'multiple commas' },
    { input: 'invalid', expected: '0', name: 'invalid string' },
    { input: '0', expected: '0', name: 'zero' },
    { input: '0.0', expected: '0', name: 'zero with decimal' },
    { input: '1e6', expected: '1000000', name: 'scientific notation' },
    { input: '  123.45  ', expected: '123.45', name: 'string with whitespace' },
    {
      input: '12.345,67',
      expected: '12345.67',
      name: 'larger European format',
    },
    {
      input: '123,45',
      expected: '123.45',
      name: 'simple European decimal (ambiguous case)',
    },
  ];

  testCases.forEach(({ input, expected, name }) => {
    it(`handles ${name}`, () => {
      expect(sanitizeForBig(input)).toBe(expected);
    });
  });

  it('produces strings that work with Big.js constructor', () => {
    const Big = require('big.js');

    const testValues = ['1,234.56', '1.234,56', '123.45', '-999.99'];

    testValues.forEach((value) => {
      const sanitized = sanitizeForBig(value);
      expect(() => new Big(sanitized)).not.toThrow();

      // Verify the Big.js number has the expected value
      const bigNum = new Big(sanitized);
      expect(bigNum.toString()).toMatch(/^-?\d+(\.\d+)?$/);
    });
  });
});
