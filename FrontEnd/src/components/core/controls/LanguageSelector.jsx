import { Select } from 'antd';
import { useDiary } from '../../../helpers/core/i18n';

const LanguageSelector = () => {
  const { t, i18n } = useDiary();
  return (
    <Select
      className="language-selector"
      aria-label={t('Language')}
      value={i18n.resolvedLanguage || 'en'}
      onChange={language => i18n.changeLanguage(language)}
      options={[
        { value: 'en', label: 'English' },
        { value: 'it', label: 'Italiano' }
      ]}
    />
  );
};

export default LanguageSelector;
