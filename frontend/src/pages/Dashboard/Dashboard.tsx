import { useQuery } from '@tanstack/react-query';
import { Package, Layers, MapPin, Factory, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { spoolsApi, materialsApi, manufacturersApi } from '../../api';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../components/ui';
import { BarChart, PieChart } from '../../components/Charts';
import type { Spool, PagedResponse } from '../../types';
import styles from './Dashboard.module.css';

const locationLabels: Record<string, string> = {
  AMS: 'AMS',
  PRINTER: 'Printer',
  RACK: 'Rack',
  STORAGE: 'Storage',
  IN_USE: 'In Use',
  EMPTY: 'Empty',
};

export function Dashboard() {
  const { data: spoolsData } = useQuery({
    queryKey: ['spools'],
    queryFn: () => spoolsApi.getAll(),
  });

  // Handle both paginated and non-paginated responses
  const spools: Spool[] = Array.isArray(spoolsData)
    ? spoolsData
    : (spoolsData as PagedResponse<Spool>)?.data || [];

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.getAll(),
  });

  const { data: manufacturers = [] } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.getAll(),
  });

  const { data: locationStats = [] } = useQuery({
    queryKey: ['spools', 'stats', 'location'],
    queryFn: () => spoolsApi.getStatsByLocation(),
  });

  const { data: materialStats = [] } = useQuery({
    queryKey: ['spools', 'stats', 'material'],
    queryFn: () => spoolsApi.getStatsByMaterial(),
  });

  const activeSpools = spools.filter((s: Spool) => !s.isEmpty);
  const lowSpools = activeSpools.filter((s: Spool) => {
    const remaining = s.remainingPercentage ?? 
      (s.initialWeightGrams && s.currentWeightGrams 
        ? (s.currentWeightGrams / s.initialWeightGrams) * 100 
        : 100);
    return remaining < 20;
  });

  const stats = [
    { 
      label: 'Total Spools', 
      value: activeSpools.length, 
      icon: Package, 
      color: 'var(--color-accent-primary)',
      link: '/spools'
    },
    { 
      label: 'Materials', 
      value: materials.length, 
      icon: Layers, 
      color: 'var(--color-info)',
      link: '/materials'
    },
    { 
      label: 'Manufacturers', 
      value: manufacturers.length, 
      icon: Factory, 
      color: 'var(--color-warning)',
      link: '/manufacturers'
    },
    { 
      label: 'Low Stock', 
      value: lowSpools.length, 
      icon: AlertTriangle, 
      color: 'var(--color-danger)',
      link: '/spools?lowStock=true'
    },
  ];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview of your filament inventory</p>
      </header>

      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20` }}>
                <Icon size={24} style={{ color: stat.color }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>
              <MapPin size={18} style={{ marginRight: 8 }} />
              Spools by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationStats.length === 0 ? (
              <p className={styles.emptyText}>No spools tracked yet</p>
            ) : (
              <>
                <BarChart
                  data={locationStats.map(stat => ({
                    name: locationLabels[stat.location] || stat.location,
                    value: stat.count,
                  }))}
                  dataKey="value"
                  color="var(--color-accent-primary)"
                  height={250}
                />
                <div className={styles.locationList}>
                  {locationStats.map((stat) => (
                    <div key={stat.location} className={styles.locationItem}>
                      <span className={styles.locationName}>
                        {locationLabels[stat.location] || stat.location}
                      </span>
                      <Badge variant="default">{stat.count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Layers size={18} style={{ marginRight: 8 }} />
              Spools by Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materialStats.length === 0 ? (
              <p className={styles.emptyText}>No spools tracked yet</p>
            ) : (
              <>
                <PieChart
                  data={materialStats.map(stat => ({
                    name: stat.material,
                    value: stat.count,
                  }))}
                  height={250}
                />
                <div className={styles.materialList}>
                  {materialStats.map((stat) => (
                    <div key={stat.material} className={styles.materialItem}>
                      <span className={styles.materialName}>{stat.material}</span>
                      <div className={styles.materialBar}>
                        <div 
                          className={styles.materialBarFill}
                          style={{ 
                            width: `${(stat.count / Math.max(...materialStats.map(s => s.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className={styles.materialCount}>{stat.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={styles.recentCard}>
          <CardHeader>
            <CardTitle>
              <TrendingUp size={18} style={{ marginRight: 8 }} />
              Recently Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSpools.filter((s: Spool) => s.lastUsedDate).length === 0 ? (
              <p className={styles.emptyText}>No recent activity</p>
            ) : (
              <div className={styles.recentList}>
                {activeSpools
                  .filter((s: Spool) => s.lastUsedDate)
                  .sort((a: Spool, b: Spool) => new Date(b.lastUsedDate!).getTime() - new Date(a.lastUsedDate!).getTime())
                  .slice(0, 5)
                  .map((spool: Spool) => (
                    <div key={spool.id} className={styles.recentItem}>
                      <div 
                        className={styles.recentColor}
                        style={{ backgroundColor: spool.colorHexCode }}
                      />
                      <div className={styles.recentInfo}>
                        <span className={styles.recentName}>{spool.colorName}</span>
                        <span className={styles.recentMaterial}>
                          {spool.materialName} • {spool.filamentTypeName}
                        </span>
                      </div>
                      <span className={styles.recentDate}>
                        {new Date(spool.lastUsedDate!).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {lowSpools.length > 0 && (
          <Card className={styles.lowStockCard}>
            <CardHeader>
              <CardTitle>
                <AlertTriangle size={18} style={{ marginRight: 8, color: 'var(--color-danger)' }} />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.lowStockList}>
                {lowSpools.slice(0, 5).map((spool: Spool) => {
                  const remaining = spool.remainingPercentage ?? 
                    (spool.initialWeightGrams && spool.currentWeightGrams 
                      ? (spool.currentWeightGrams / spool.initialWeightGrams) * 100 
                      : 0);
                  return (
                    <div key={spool.id} className={styles.lowStockItem}>
                      <div 
                        className={styles.recentColor}
                        style={{ backgroundColor: spool.colorHexCode }}
                      />
                      <div className={styles.recentInfo}>
                        <span className={styles.recentName}>{spool.colorName}</span>
                        <span className={styles.recentMaterial}>
                          {spool.materialName} • {spool.filamentTypeName}
                        </span>
                      </div>
                      <Badge variant="danger">{remaining.toFixed(0)}%</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

