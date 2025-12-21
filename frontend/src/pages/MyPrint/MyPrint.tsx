import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, Check, Weight, Clock, Printer } from 'lucide-react';
import { spoolsApi } from '../../api';
import { Button, Card, Modal, Select } from '../../components/ui';
import { parsePrintFile, type ParsedPrintFile, type FilamentUsage } from '../../utils/printFileParser';
import type { Spool, PagedResponse } from '../../types';
import styles from './MyPrint.module.css';

interface FilamentAssignment {
  usage: FilamentUsage;
  selectedSpoolId: number | null;
  deductWeight: number;
}

export function MyPrint() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedPrintFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignments, setAssignments] = useState<FilamentAssignment[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deductionComplete, setDeductionComplete] = useState(false);

  const { data: spoolsData } = useQuery({
    queryKey: ['spools'],
    queryFn: () => spoolsApi.getAll(),
  });

  // Handle both paginated and non-paginated responses
  const spools: Spool[] = Array.isArray(spoolsData)
    ? spoolsData
    : (spoolsData as PagedResponse<Spool>)?.data || [];

  // Filter to only show spools with remaining filament
  const availableSpools = spools.filter((s: Spool) => !s.isEmpty && (s.currentWeightGrams ?? 0) > 0);

  const updateWeightMutation = useMutation({
    mutationFn: async ({ spoolId, newWeight }: { spoolId: number; newWeight: number }) => {
      return spoolsApi.updateWeight(spoolId, newWeight);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spools'] });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setDeductionComplete(false);
    
    try {
      const result = await parsePrintFile(file);
      setParsedFile(result);
      
      // Auto-assign spools based on color/material matching
      const initialAssignments: FilamentAssignment[] = result.filamentUsages.map(usage => {
        const matchedSpool = findBestMatch(usage, availableSpools);
        return {
          usage,
          selectedSpoolId: matchedSpool?.id ?? null,
          deductWeight: usage.weightGrams,
        };
      });
      
      setAssignments(initialAssignments);
    } catch (error) {
      console.error('Failed to parse file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const findBestMatch = (usage: FilamentUsage, spools: Spool[]): Spool | null => {
    // Try to match by color hex code
    if (usage.colorHex) {
      const colorMatch = spools.find(s => 
        s.colorHexCode.toLowerCase() === usage.colorHex?.toLowerCase()
      );
      if (colorMatch) return colorMatch;
    }

    // Try to match by material type
    if (usage.material) {
      const materialMatch = spools.find(s => 
        s.materialName.toLowerCase().includes(usage.material?.toLowerCase() ?? '')
      );
      if (materialMatch) return materialMatch;
    }

    // Try to match by product code
    if (usage.productCode) {
      const productMatch = spools.find(s => 
        s.colorProductCode === usage.productCode
      );
      if (productMatch) return productMatch;
    }

    return null;
  };

  const handleSpoolChange = (index: number, spoolId: number | null) => {
    setAssignments(prev => prev.map((a, i) => 
      i === index ? { ...a, selectedSpoolId: spoolId } : a
    ));
  };

  const handleWeightChange = (index: number, weight: number) => {
    setAssignments(prev => prev.map((a, i) => 
      i === index ? { ...a, deductWeight: weight } : a
    ));
  };

  const handleConfirmDeduction = () => {
    setShowConfirmModal(true);
  };

  const executeDeduction = async () => {
    setShowConfirmModal(false);
    
    for (const assignment of assignments) {
      if (assignment.selectedSpoolId && assignment.deductWeight > 0) {
        const spool = spools.find(s => s.id === assignment.selectedSpoolId);
        if (spool) {
          const newWeight = Math.max(0, (spool.currentWeightGrams ?? 0) - assignment.deductWeight);
          await updateWeightMutation.mutateAsync({
            spoolId: assignment.selectedSpoolId,
            newWeight,
          });
        }
      }
    }
    
    setDeductionComplete(true);
  };

  const resetForm = () => {
    setParsedFile(null);
    setAssignments([]);
    setDeductionComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalDeduction = assignments.reduce((sum, a) => sum + (a.selectedSpoolId ? a.deductWeight : 0), 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Print</h1>
          <p className={styles.subtitle}>
            Upload a sliced print file to subtract filament usage from your inventory
          </p>
        </div>
      </header>

      {!parsedFile && (
        <Card className={styles.uploadCard}>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".3mf,.gcode,.gco"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            
            {isProcessing ? (
              <div className={styles.processing}>
                <div className={styles.spinner} />
                <p>Processing file...</p>
              </div>
            ) : (
              <>
                <Upload size={48} className={styles.uploadIcon} />
                <h3>Drag & drop or click to upload</h3>
                <p className={styles.dropZoneHint}>
                  Supported formats:
                </p>
                <ul className={styles.formatList}>
                  <li><FileText size={16} /> 3MF file from MakerWorld</li>
                  <li><FileText size={16} /> Sliced 3MF from Bambu or Orca Slicer</li>
                  <li><FileText size={16} /> Exported G-code file</li>
                </ul>
                <p className={styles.privacyNote}>
                  <AlertCircle size={14} />
                  Your file stays on your device - only usage data is processed
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      {parsedFile && !deductionComplete && (
        <div className={styles.resultsSection}>
          <Card className={styles.fileInfoCard}>
            <div className={styles.fileInfo}>
              <FileText size={24} />
              <div>
                <h3>{parsedFile.projectName || parsedFile.filename}</h3>
                <p className={styles.filename}>{parsedFile.filename}</p>
              </div>
              {parsedFile.printTime && (
                <div className={styles.printTime}>
                  <Clock size={16} />
                  {formatTime(parsedFile.printTime)}
                </div>
              )}
              <Button variant="ghost" onClick={resetForm}>
                Change File
              </Button>
            </div>
          </Card>

          {parsedFile.parseErrors.length > 0 && (
            <div className={styles.errors}>
              {parsedFile.parseErrors.map((error, i) => (
                <div key={i} className={styles.errorItem}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              ))}
            </div>
          )}

          {assignments.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                <Weight size={20} />
                Filament Usage ({assignments.length} {assignments.length === 1 ? 'color' : 'colors'})
              </h2>

              <div className={styles.usageList}>
                {assignments.map((assignment, index) => (
                  <Card key={index} className={styles.usageCard}>
                    <div className={styles.usageHeader}>
                      <div 
                        className={styles.colorSwatch}
                        style={{ backgroundColor: assignment.usage.colorHex || '#ccc' }}
                      />
                      <div className={styles.usageInfo}>
                        <span className={styles.usageMaterial}>
                          {assignment.usage.type || assignment.usage.material || 'Unknown Material'}
                        </span>
                        <span className={styles.usageWeight}>
                          {assignment.usage.weightGrams.toFixed(1)}g
                          {assignment.usage.lengthMeters && (
                            <span className={styles.usageLength}>
                              ({assignment.usage.lengthMeters.toFixed(2)}m)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className={`${styles.confidence} ${styles[assignment.usage.matchConfidence]}`}>
                        {assignment.usage.matchConfidence === 'high' ? 'Auto-matched' :
                         assignment.usage.matchConfidence === 'medium' ? 'Partial match' : 'Manual'}
                      </span>
                    </div>

                    <div className={styles.assignmentRow}>
                      <div className={styles.spoolSelect}>
                        <label>Deduct from:</label>
                        <Select
                          value={assignment.selectedSpoolId?.toString() ?? ''}
                          onChange={(e) => handleSpoolChange(index, e.target.value ? parseInt(e.target.value) : null)}
                          options={[
                            { value: '', label: 'Skip this filament' },
                            ...availableSpools.map((spool: Spool) => ({
                              value: spool.id.toString(),
                              label: `${spool.manufacturerName} - ${spool.colorName} (${spool.currentWeightGrams?.toFixed(0)}g remaining)`
                            }))
                          ]}
                        />
                      </div>

                      <div className={styles.weightInput}>
                        <label>Amount (g):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={assignment.deductWeight}
                          onChange={(e) => handleWeightChange(index, parseFloat(e.target.value) || 0)}
                          className={styles.numberInput}
                        />
                      </div>
                    </div>

                    {assignment.selectedSpoolId && (
                      <div className={styles.preview}>
                        {(() => {
                          const spool = spools.find((s: Spool) => s.id === assignment.selectedSpoolId);
                          if (!spool) return null;
                          const newWeight = Math.max(0, (spool.currentWeightGrams ?? 0) - assignment.deductWeight);
                          return (
                            <span>
                              {spool.currentWeightGrams?.toFixed(1)}g → {newWeight.toFixed(1)}g
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span>Total to deduct:</span>
                  <strong>{totalDeduction.toFixed(1)}g</strong>
                </div>
                <Button 
                  onClick={handleConfirmDeduction}
                  disabled={totalDeduction === 0}
                  size="lg"
                >
                  <Printer size={18} />
                  Confirm Print & Deduct
                </Button>
              </div>
            </>
          )}

          {assignments.length === 0 && parsedFile.parseErrors.length === 0 && (
            <Card className={styles.noDataCard}>
              <AlertCircle size={32} />
              <h3>No filament data found</h3>
              <p>
                This file doesn't contain filament usage information.
                Try exporting a sliced 3MF from Bambu Studio or Orca Slicer.
              </p>
            </Card>
          )}
        </div>
      )}

      {deductionComplete && (
        <Card className={styles.successCard}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <Check size={48} />
            </div>
            <h2>Print Recorded!</h2>
            <p>
              Successfully deducted {totalDeduction.toFixed(1)}g from your inventory.
            </p>
            <Button onClick={resetForm} size="lg">
              Record Another Print
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Deduction"
      >
        <div className={styles.confirmModal}>
          <p>You're about to deduct the following from your inventory:</p>
          <ul className={styles.confirmList}>
            {assignments.filter(a => a.selectedSpoolId).map((assignment, index) => {
              const spool = spools.find((s: Spool) => s.id === assignment.selectedSpoolId);
              return (
                <li key={index}>
                  <strong>{assignment.deductWeight.toFixed(1)}g</strong> from{' '}
                  {spool?.manufacturerName} {spool?.colorName}
                </li>
              );
            })}
          </ul>
          <div className={styles.confirmActions}>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={executeDeduction}>
              Confirm Deduction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

