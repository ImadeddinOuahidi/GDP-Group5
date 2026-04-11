import translations, { SPEECH_LANG_MAP, SUPPORTED_LANGUAGES } from './translations';

const requiredKeys = [
  'nav.appTitle',
  'settings.sections.language',
  'report.alerts.possibleDuplicateMessage',
];

const getValue = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj);

describe('mobile translation resources', () => {
  test('define supported languages that map to translation bundles and speech locales', () => {
    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      expect(translations[code]).toBeDefined();
      expect(typeof SPEECH_LANG_MAP[code]).toBe('string');
      expect(SPEECH_LANG_MAP[code].length).toBeGreaterThan(0);
    });
  });

  test('include the key multilingual report strings used by the mobile app', () => {
    Object.keys(translations).forEach((locale) => {
      requiredKeys.forEach((key) => {
        expect(typeof getValue(translations[locale], key)).toBe('string');
        expect(getValue(translations[locale], key).length).toBeGreaterThan(0);
      });
    });
  });

  test('preserve duplicate-report interpolation placeholders in every language', () => {
    Object.values(translations).forEach((locale) => {
      const message = locale.report.alerts.possibleDuplicateMessage;
      expect(message).toContain('{{count}}');
      expect(message).toContain('{{suffix}}');
    });
  });
});
