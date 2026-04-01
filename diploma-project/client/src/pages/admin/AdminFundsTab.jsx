import { useLanguage } from '../../contexts/LanguageContext';

const AdminFundsTab = () => {
  const { t } = useLanguage();

  return (
    <div className="admin-section">
      <h2>{t('manageFunds') || 'Управление фондами'}</h2>
      <div className="admin-empty-state">
        <span className="material-icons">account_balance</span>
        <p>{t('fundsComingSoon') || 'Здесь будет управление экологическими фондами и их финансированием'}</p>
      </div>
    </div>
  );
};

export default AdminFundsTab;
