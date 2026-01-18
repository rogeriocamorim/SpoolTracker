import { useState, useEffect } from 'react';
import { Save, Database, Palette, Bell, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '../../api/client';
import { settingsApi, type SeedStatus } from '../../api';
import { logger } from '../../utils/logger';
import styles from './Settings.module.css';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [defaultWeight, setDefaultWeight] = useState('1000');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<SeedStatus | null>(null);

  // Load settings and seed status on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.get();
        setDefaultWeight(settings.defaultWeightGrams?.toString() || '1000');
        setDefaultCurrency(settings.defaultCurrency || 'USD');
        setLowStockThreshold(settings.lowStockThreshold?.toString() || '20');
      } catch (error) {
        logger.error('Failed to load settings', error instanceof Error ? error : new Error(String(error)), { component: 'Settings' });
        showErrorToast('Failed to load settings. Using defaults.');
      }
    };
    
    const loadSeedStatus = async () => {
      try {
        const status = await settingsApi.getSeedStatus();
        setSeedStatus(status);
      } catch (error) {
        logger.error('Failed to load seed status', error instanceof Error ? error : new Error(String(error)), { component: 'Settings' });
      }
    };
    
    loadSettings();
    loadSeedStatus();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.update({
        defaultWeightGrams: parseInt(defaultWeight, 10) || 1000,
        defaultCurrency: defaultCurrency || 'USD',
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 20,
      });
      showSuccessToast('Settings saved successfully!');
    } catch (error) {
      logger.error('Failed to save settings', error instanceof Error ? error : new Error(String(error)), { component: 'Settings' });
      showErrorToast('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure your SpoolTracker preferences</p>
        </div>
      </header>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>
              <Database size={18} style={{ marginRight: 8 }} />
              Default Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.settingsGroup}>
              <Input
                label="Default Spool Weight (grams)"
                type="number"
                value={defaultWeight}
                onChange={(e) => setDefaultWeight(e.target.value)}
                helperText="Default weight for new spools (typically 1000g)"
              />
              <Input
                label="Default Currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                helperText="Currency code for purchase prices (e.g., USD, EUR, BRL)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell size={18} style={{ marginRight: 8 }} />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.settingsGroup}>
              <Input
                label="Low Stock Threshold (%)"
                type="number"
                min="0"
                max="100"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                helperText="Show alert when spool is below this percentage"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Palette size={18} style={{ marginRight: 8 }} />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.settingsGroup}>
              <div className={styles.themeOption}>
                <span className={styles.themeLabel}>Theme</span>
                <div className={styles.themeButtons}>
                  <button 
                    className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </button>
                  <button 
                    className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Download size={18} style={{ marginRight: 8 }} />
              Seed Default Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.settingsGroup}>
              <p className={styles.seedDescription}>
                Pre-fill the database with Bambu Lab filament types and colors.
                This will only add data that doesn't already exist.
              </p>
              
              {seedStatus && (
                <div className={styles.seedStatus}>
                  <div className={styles.seedStatusItem}>
                    {seedStatus.manufacturersSeeded ? (
                      <CheckCircle size={16} className={styles.seedCheck} />
                    ) : (
                      <AlertCircle size={16} className={styles.seedMissing} />
                    )}
                    <span>Manufacturers: {seedStatus.manufacturerCount}</span>
                  </div>
                  <div className={styles.seedStatusItem}>
                    {seedStatus.materialsSeeded ? (
                      <CheckCircle size={16} className={styles.seedCheck} />
                    ) : (
                      <AlertCircle size={16} className={styles.seedMissing} />
                    )}
                    <span>Materials: {seedStatus.materialCount}</span>
                  </div>
                  <div className={styles.seedStatusItem}>
                    {seedStatus.filamentTypesSeeded ? (
                      <CheckCircle size={16} className={styles.seedCheck} />
                    ) : (
                      <AlertCircle size={16} className={styles.seedMissing} />
                    )}
                    <span>Filament Types: {seedStatus.filamentTypeCount}</span>
                  </div>
                  <div className={styles.seedStatusItem}>
                    {seedStatus.colorsSeeded ? (
                      <CheckCircle size={16} className={styles.seedCheck} />
                    ) : (
                      <AlertCircle size={16} className={styles.seedMissing} />
                    )}
                    <span>Colors: {seedStatus.colorCount}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={async () => {
                  setIsSeeding(true);
                  try {
                    const result = await settingsApi.seedData();
                    const status = await settingsApi.getSeedStatus();
                    setSeedStatus(status);
                    
                    if (result.manufacturersSeeded || result.materialsSeeded || 
                        result.filamentTypesSeeded || result.colorsSeeded) {
                      showSuccessToast('Default data seeded successfully!');
                    } else {
                      showSuccessToast('All default data already exists.');
                    }
                  } catch (error) {
                    logger.error('Failed to seed data', error instanceof Error ? error : new Error(String(error)), { component: 'Settings' });
                    showErrorToast('Failed to seed data. Please try again.');
                  } finally {
                    setIsSeeding(false);
                  }
                }}
                isLoading={isSeeding}
                variant="secondary"
              >
                <Database size={18} />
                Seed Bambu Lab Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.footer}>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save size={18} />
          Save Settings
        </Button>
      </div>

      <div className={styles.about}>
        <h3>About SpoolTracker</h3>
        <p>Version 1.0.0</p>
        <p className={styles.aboutText}>
          A filament spool management system for 3D printing enthusiasts.
          Built with Quarkus and React.
        </p>
      </div>
    </div>
  );
}

