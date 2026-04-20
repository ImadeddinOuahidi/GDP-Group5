import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const locales = { en, fr, es };
const requiredKeys = [
  'common.loading',
  'auth.signIn',
  'dashboard.welcomeBack',
  'reports.submitReport',
];

const getValue = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj);

describe('frontend locale coverage', () => {
  test('provides every critical UI string in English, French, and Spanish', () => {
    Object.values(locales).forEach((locale) => {
      requiredKeys.forEach((key) => {
        expect(typeof getValue(locale, key)).toBe('string');
        expect(getValue(locale, key).length).toBeGreaterThan(0);
      });
    });
  });

  test('keeps interpolation placeholders for welcome messages across locales', () => {
    expect(en.dashboard.welcomeBack).toContain('{{name}}');
    expect(fr.dashboard.welcomeBack).toContain('{{name}}');
    expect(es.dashboard.welcomeBack).toContain('{{name}}');
  });
});
