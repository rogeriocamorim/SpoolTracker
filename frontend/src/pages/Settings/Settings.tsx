import { useState } from 'react';
import { Save, RefreshCw, Database, Palette, Bell } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Settings.module.css';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [defaultWeight, setDefaultWeight] = useState('1000');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in a real app, this would persist to backend/localStorage
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
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
              <RefreshCw size={18} style={{ marginRight: 8 }} />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.settingsGroup}>
              <div className={styles.dataAction}>
                <div>
                  <h4>Export Data</h4>
                  <p>Download all your spool data as JSON</p>
                </div>
                <Button variant="secondary" size="sm">
                  Export
                </Button>
              </div>
              <div className={styles.dataAction}>
                <div>
                  <h4>Import Data</h4>
                  <p>Import spool data from a JSON file</p>
                </div>
                <Button variant="secondary" size="sm">
                  Import
                </Button>
              </div>
              <div className={styles.dataAction}>
                <div>
                  <h4>Reset Sample Data</h4>
                  <p>Reload default Bambu Lab filament data</p>
                </div>
                <Button variant="secondary" size="sm">
                  Reset
                </Button>
              </div>
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

