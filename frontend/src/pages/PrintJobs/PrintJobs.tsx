import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Check, AlertCircle, Clock, Scale, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { printJobsApi, type PrintJobParseResult, type FilamentDeductionRequest, type FilamentMatch } from '../../api';
import { Button, Card } from '../../components/ui';
import styles from './PrintJobs.module.css';

export function PrintJobs() {
  const [parseResult, setParseResult] = useState<PrintJobParseResult | null>(null);
  const [selectedSpools, setSelectedSpools] = useState<Map<number, number>>(new Map()); // filamentId -> spoolId
  const [expandedFilaments, setExpandedFilaments] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parseMutation = useMutation({
    mutationFn: (file: File) => printJobsApi.parse3mf(file),
    onSuccess: (data) => {
      setParseResult(data);
      setError(null);
      setSuccess(false);
      // Auto-select best matching spool for each filament
      const autoSelections = new Map<number, number>();
      data.filaments.forEach((filament) => {
        if (filament.matchingSpools.length > 0) {
          autoSelections.set(filament.usage.id, filament.matchingSpools[0].id);
        }
      });
      setSelectedSpools(autoSelections);
      // Expand all filaments initially
      setExpandedFilaments(new Set(data.filaments.map(f => f.usage.id)));
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to parse 3MF file');
      setParseResult(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (deductions: FilamentDeductionRequest[]) => printJobsApi.confirmPrintJob(deductions),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to confirm print job');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseMutation.mutate(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    const fileName = file?.name.toLowerCase() || '';
    if (file && fileName.endsWith('.gcode.3mf')) {
      parseMutation.mutate(file);
    } else {
      setError('Please upload a .gcode.3mf file (sliced file from Bambu Studio)');
    }
  }, [parseMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSpoolSelect = (filamentId: number, spoolId: number) => {
    setSelectedSpools(prev => new Map(prev).set(filamentId, spoolId));
  };

  const toggleFilamentExpand = (filamentId: number) => {
    setExpandedFilaments(prev => {
      const next = new Set(prev);
      if (next.has(filamentId)) {
        next.delete(filamentId);
      } else {
        next.add(filamentId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!parseResult) return;

    const deductions: FilamentDeductionRequest[] = [];
    parseResult.filaments.forEach((filament) => {
      const spoolId = selectedSpools.get(filament.usage.id);
      if (spoolId) {
        deductions.push({
          spoolId,
          gramsUsed: filament.usage.usedGrams,
          colorHex: filament.usage.colorHex,
          type: filament.usage.type,
        });
      }
    });

    if (deductions.length === 0) {
      setError('Please select at least one spool to deduct from');
      return;
    }

    confirmMutation.mutate(deductions);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getColorStyle = (hex: string) => ({
    backgroundColor: hex,
    border: hex.toUpperCase() === '#FFFFFF' ? '1px solid #ccc' : 'none',
  });

  const renderFilamentCard = (filament: FilamentMatch) => {
    const isExpanded = expandedFilaments.has(filament.usage.id);
    const selectedSpoolId = selectedSpools.get(filament.usage.id);
    const selectedSpool = filament.matchingSpools.find(s => s.id === selectedSpoolId);
    const hasEnoughFilament = selectedSpool 
      ? (selectedSpool.currentWeightGrams ?? 0) >= filament.usage.usedGrams
      : false;

    return (
      <Card key={filament.usage.id} className={styles.filamentCard}>
        <div 
          className={styles.filamentHeader}
          onClick={() => toggleFilamentExpand(filament.usage.id)}
        >
          <div className={styles.filamentInfo}>
            <div 
              className={styles.colorSwatch} 
              style={getColorStyle(filament.usage.colorHex)}
            />
            <div className={styles.filamentDetails}>
              <span className={styles.filamentType}>{filament.usage.type}</span>
              <span className={styles.filamentColor}>{filament.usage.colorHex}</span>
            </div>
          </div>
          <div className={styles.filamentUsage}>
            <span className={styles.usageAmount}>{filament.usage.usedGrams.toFixed(1)}g</span>
            <span className={styles.usageMeters}>({filament.usage.usedMeters.toFixed(1)}m)</span>
          </div>
          <div className={styles.filamentStatus}>
            {selectedSpool ? (
              <div className={`${styles.statusBadge} ${hasEnoughFilament ? styles.statusOk : styles.statusWarning}`}>
                {hasEnoughFilament ? <Check size={14} /> : <AlertCircle size={14} />}
                {selectedSpool.colorName}
              </div>
            ) : (
              <div className={`${styles.statusBadge} ${styles.statusError}`}>
                <AlertCircle size={14} />
                No match
              </div>
            )}
          </div>
          <button className={styles.expandButton}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isExpanded && (
          <div className={styles.spoolList}>
            {filament.matchingSpools.length === 0 ? (
              <div className={styles.noMatches}>
                No matching spools found for {filament.usage.type} {filament.usage.colorHex}
              </div>
            ) : (
              filament.matchingSpools.map((spool) => (
                <div
                  key={spool.id}
                  className={`${styles.spoolOption} ${selectedSpoolId === spool.id ? styles.spoolSelected : ''}`}
                  onClick={() => handleSpoolSelect(filament.usage.id, spool.id)}
                >
                  <div className={styles.spoolColor}>
                    <div 
                      className={styles.colorSwatch} 
                      style={getColorStyle(spool.colorHexCode)}
                    />
                  </div>
                  <div className={styles.spoolInfo}>
                    <div className={styles.spoolName}>
                      {spool.manufacturerName} {spool.filamentTypeName} - {spool.colorName}
                    </div>
                    <div className={styles.spoolMeta}>
                      {spool.storageLocationName} • {spool.currentWeightGrams?.toFixed(0) ?? '?'}g remaining
                      {spool.remainingPercentage && ` (${spool.remainingPercentage.toFixed(0)}%)`}
                    </div>
                  </div>
                  <div className={styles.spoolMatch}>
                    <span className={`${styles.matchScore} ${spool.matchScore >= 90 ? styles.matchExcellent : spool.matchScore >= 70 ? styles.matchGood : styles.matchFair}`}>
                      {spool.matchScore}%
                    </span>
                    {(spool.currentWeightGrams ?? 0) < filament.usage.usedGrams && (
                      <span className={styles.lowWarning}>Low</span>
                    )}
                  </div>
                  <div className={styles.spoolRadio}>
                    <input
                      type="radio"
                      name={`filament-${filament.usage.id}`}
                      checked={selectedSpoolId === spool.id}
                      onChange={() => handleSpoolSelect(filament.usage.id, spool.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Printer size={28} />
          Print Job
        </h1>
        <p className={styles.subtitle}>
          Upload a 3MF file to track filament usage from your prints
        </p>
      </div>

      {/* Upload Area */}
      {!parseResult && (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} className={styles.uploadIcon} />
          <p className={styles.uploadText}>
            Drag & drop a .gcode.3mf file here, or click to browse
          </p>
          <p className={styles.uploadHint}>
            Sliced files from Bambu Studio
          </p>
          <input
            type="file"
            accept=".gcode.3mf"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {parseMutation.isPending && (
            <div className={styles.loading}>Parsing file...</div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={styles.successMessage}>
          <Check size={20} />
          Print job confirmed! Filament weights have been updated.
        </div>
      )}

      {/* Parse Result */}
      {parseResult && !success && (
        <div className={styles.result}>
          {/* Summary Card */}
          <Card className={styles.summaryCard}>
            <h2 className={styles.fileName}>{parseResult.fileName}</h2>
            <div className={styles.summaryStats}>
              <div className={styles.stat}>
                <Printer size={20} />
                <span>{parseResult.printerModel}</span>
              </div>
              <div className={styles.stat}>
                <Clock size={20} />
                <span>{formatTime(parseResult.estimatedTimeSeconds)}</span>
              </div>
              <div className={styles.stat}>
                <Scale size={20} />
                <span>{parseResult.totalWeightGrams.toFixed(1)}g total</span>
              </div>
            </div>
          </Card>

          {/* Filament List */}
          <div className={styles.filamentList}>
            <h3 className={styles.sectionTitle}>
              Filament Usage ({parseResult.filaments.length} colors)
            </h3>
            {parseResult.filaments.map(renderFilamentCard)}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                setParseResult(null);
                setSelectedSpools(new Map());
                setError(null);
              }}
            >
              Upload Different File
            </Button>
            <Button
              onClick={handleConfirm}
              isLoading={confirmMutation.isPending}
              disabled={selectedSpools.size === 0}
            >
              <Check size={18} />
              Confirm & Deduct Filament
            </Button>
          </div>
        </div>
      )}

      {/* Success - New Print Button */}
      {success && (
        <div className={styles.successActions}>
          <Button
            onClick={() => {
              setParseResult(null);
              setSelectedSpools(new Map());
              setSuccess(false);
              setError(null);
            }}
          >
            <Upload size={18} />
            Upload Another Print
          </Button>
        </div>
      )}
    </div>
  );
}

