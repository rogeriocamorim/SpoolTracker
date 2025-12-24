import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Factory, 
  Palette,
  Settings,
  ScanLine,
  MapPin,
  Upload
} from 'lucide-react';
import { QRScanner } from '../QRScanner';
import { DualQRScanner } from '../DualQRScanner';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/spools', label: 'Spools', icon: Package },
  { path: '/locations', label: 'Locations', icon: MapPin },
  { path: '/print-jobs', label: 'Print Job', icon: Upload },
  { path: '/materials', label: 'Materials', icon: Layers },
  { path: '/filament-types', label: 'Filament Types', icon: Palette },
  { path: '/manufacturers', label: 'Manufacturers', icon: Factory },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDualScannerOpen, setIsDualScannerOpen] = useState(false);

  const handleScan = (url: string) => {
    setIsScannerOpen(false);
    const spoolMatch = url.match(/\/spools\/([^/]+)$/);
    const locationMatch = url.match(/\/locations\/(\d+)$/);
    if (spoolMatch) {
      navigate(`/spools/${spoolMatch[1]}`);
    } else if (locationMatch) {
      navigate(`/locations/${locationMatch[1]}`);
    }
  };

  const handleDualScanSuccess = () => {
    // Optionally navigate or show success message
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Package className={styles.logoIcon} />
          <span className={styles.logoText}>SpoolTracker</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.scanButtons}>
          <button 
            className={styles.scanButton}
            onClick={() => setIsScannerOpen(true)}
            title="Scan QR Code"
          >
            <ScanLine size={20} />
            <span>Scan QR</span>
          </button>
          <button 
            className={styles.scanButton + ' ' + styles.dualScanButton}
            onClick={() => setIsDualScannerOpen(true)}
            title="Move Spool to Location"
          >
            <ScanLine size={20} />
            <span>Move Spool</span>
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <Link to="/settings" className={styles.navItem}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {isScannerOpen && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isDualScannerOpen && (
        <DualQRScanner
          onClose={() => setIsDualScannerOpen(false)}
          onSuccess={handleDualScanSuccess}
        />
      )}
    </div>
  );
}

