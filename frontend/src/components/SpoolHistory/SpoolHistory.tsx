import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Weight, Package, AlertCircle } from 'lucide-react';
import { historyApi } from '../../api/history';
import styles from './SpoolHistory.module.css';

interface SpoolHistoryProps {
  spoolId: number;
}

export function SpoolHistory({ spoolId }: SpoolHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['spool-history', spoolId],
    queryFn: () => historyApi.getSpoolHistory(spoolId),
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <Clock size={32} />
          <p>No history available for this spool</p>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOCATION_CHANGED':
        return <MapPin size={16} />;
      case 'WEIGHT_UPDATED':
        return <Weight size={16} />;
      case 'MARKED_EMPTY':
        return <AlertCircle size={16} />;
      case 'SPOOL_CREATED':
        return <Package size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'LOCATION_CHANGED':
        return 'Location Changed';
      case 'WEIGHT_UPDATED':
        return 'Weight Updated';
      case 'MARKED_EMPTY':
        return 'Marked Empty';
      case 'SPOOL_CREATED':
        return 'Spool Created';
      case 'FIELD_UPDATED':
        return 'Field Updated';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>History</h3>
      <div className={styles.timeline}>
        {history.map((entry) => (
          <div key={entry.id} className={styles.timelineItem}>
            <div className={styles.timelineMarker}>
              {getActionIcon(entry.action)}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={styles.actionLabel}>
                  {getActionLabel(entry.action)}
                </span>
                <span className={styles.timestamp}>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
              <p className={styles.description}>{entry.description}</p>
              {entry.oldValue && entry.newValue && (
                <div className={styles.valueChange}>
                  <span className={styles.oldValue}>
                    {entry.oldValue.length > 50 
                      ? entry.oldValue.substring(0, 50) + '...' 
                      : entry.oldValue}
                  </span>
                  <span className={styles.arrow}>→</span>
                  <span className={styles.newValue}>
                    {entry.newValue.length > 50 
                      ? entry.newValue.substring(0, 50) + '...' 
                      : entry.newValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

