import JSZip from 'jszip';

export interface FilamentUsage {
  color?: string;
  colorHex?: string;
  material?: string;
  type?: string;
  weightGrams: number;
  lengthMeters?: number;
  productCode?: string;
  // For matching with spools
  matchConfidence: 'high' | 'medium' | 'low';
}

export interface ParsedPrintFile {
  filename: string;
  projectName?: string;
  printTime?: number; // in seconds
  filamentUsages: FilamentUsage[];
  parseErrors: string[];
}

/**
 * Parse a 3MF file and extract filament usage information
 */
export async function parse3MFFile(file: File): Promise<ParsedPrintFile> {
  const result: ParsedPrintFile = {
    filename: file.name,
    filamentUsages: [],
    parseErrors: [],
  };

  try {
    const zip = await JSZip.loadAsync(file);

    // Try to find and parse slice info (Bambu/Orca format)
    const sliceInfoFile = zip.file('Metadata/slice_info.config');
    if (sliceInfoFile) {
      const content = await sliceInfoFile.async('string');
      parseSliceInfoConfig(content, result);
    }

    // Try to find project settings
    const projectSettingsFile = zip.file('Metadata/project_settings.config');
    if (projectSettingsFile) {
      const content = await projectSettingsFile.async('string');
      parseProjectSettings(content, result);
    }

    // Try to parse plate info for sliced files
    const plateFiles = Object.keys(zip.files).filter(
      (name) => name.match(/Metadata\/plate_\d+\.json/) || name.match(/Metadata\/plate_\d+\.config/)
    );
    
    for (const platePath of plateFiles) {
      const plateFile = zip.file(platePath);
      if (plateFile) {
        const content = await plateFile.async('string');
        try {
          if (platePath.endsWith('.json')) {
            parsePlateJson(content, result);
          } else {
            parsePlateConfig(content, result);
          }
        } catch (e) {
          result.parseErrors.push(`Failed to parse ${platePath}`);
        }
      }
    }

    // Set project name from filename if not found
    if (!result.projectName) {
      result.projectName = file.name.replace(/\.(3mf|gcode)$/i, '');
    }

  } catch (error) {
    result.parseErrors.push(`Failed to parse 3MF file: ${error}`);
  }

  return result;
}

/**
 * Parse a G-code file and extract filament usage information
 */
export async function parseGCodeFile(file: File): Promise<ParsedPrintFile> {
  const result: ParsedPrintFile = {
    filename: file.name,
    projectName: file.name.replace(/\.gcode$/i, ''),
    filamentUsages: [],
    parseErrors: [],
  };

  try {
    const content = await file.text();
    const lines = content.split('\n');

    // Look for filament usage in comments (various slicer formats)
    const filamentWeightRegex = /;\s*filament\s*used\s*\[g\]\s*[:=]\s*([\d.,]+)/i;
    const filamentLengthRegex = /;\s*filament\s*used\s*\[m+\]\s*[:=]\s*([\d.,]+)/i;
    const filamentTypeRegex = /;\s*filament_type\s*[:=]\s*(.+)/i;
    const filamentColorRegex = /;\s*filament_colour\s*[:=]\s*(.+)/i;
    const printTimeRegex = /;\s*estimated\s*printing\s*time[^=]*[:=]\s*(.*)/i;
    const bambuFilamentRegex = /;\s*filament_settings_id\s*[:=]\s*(.+)/i;
    const totalWeightRegex = /;\s*total\s*filament\s*used\s*\[g\]\s*[:=]\s*([\d.,]+)/i;

    let foundWeight = false;
    const weights: number[] = [];
    const lengths: number[] = [];
    const types: string[] = [];
    const colors: string[] = [];

    // Only scan first 1000 lines for efficiency (metadata is at the top)
    const scanLines = lines.slice(0, 1000);

    for (const line of scanLines) {
      // Check for total weight
      const totalWeightMatch = line.match(totalWeightRegex);
      if (totalWeightMatch) {
        const weight = parseFloat(totalWeightMatch[1].replace(',', '.'));
        if (!isNaN(weight) && weight > 0) {
          result.filamentUsages.push({
            weightGrams: weight,
            matchConfidence: 'low',
          });
          foundWeight = true;
        }
      }

      // Check for individual filament weights
      const weightMatch = line.match(filamentWeightRegex);
      if (weightMatch) {
        const weightValues = weightMatch[1].split(/[,;]/).map(v => parseFloat(v.trim().replace(',', '.')));
        weightValues.forEach(w => {
          if (!isNaN(w) && w > 0) weights.push(w);
        });
      }

      // Check for filament lengths
      const lengthMatch = line.match(filamentLengthRegex);
      if (lengthMatch) {
        const lengthValues = lengthMatch[1].split(/[,;]/).map(v => parseFloat(v.trim().replace(',', '.')));
        lengthValues.forEach(l => {
          if (!isNaN(l) && l > 0) lengths.push(l);
        });
      }

      // Check for filament types
      const typeMatch = line.match(filamentTypeRegex);
      if (typeMatch) {
        const typeValues = typeMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean);
        types.push(...typeValues);
      }

      // Check for filament colors
      const colorMatch = line.match(filamentColorRegex);
      if (colorMatch) {
        const colorValues = colorMatch[1].split(/[,;]/).map(c => c.trim()).filter(Boolean);
        colors.push(...colorValues);
      }

      // Check for print time
      const printTimeMatch = line.match(printTimeRegex);
      if (printTimeMatch) {
        result.printTime = parsePrintTime(printTimeMatch[1]);
      }

      // Check for Bambu filament settings
      const bambuMatch = line.match(bambuFilamentRegex);
      if (bambuMatch) {
        const settings = bambuMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
        // Parse settings like "Bambu PLA Basic @BBL X1C" 
        settings.forEach(s => {
          const parts = s.match(/^(.*?)\s*@/);
          if (parts) {
            types.push(parts[1].trim());
          }
        });
      }
    }

    // Create filament usage entries from parsed data
    if (weights.length > 0 && !foundWeight) {
      weights.forEach((weight, index) => {
        result.filamentUsages.push({
          weightGrams: weight,
          lengthMeters: lengths[index],
          material: types[index]?.split(' ')[0], // e.g., "PLA" from "PLA Basic"
          type: types[index],
          colorHex: colors[index],
          matchConfidence: types[index] && colors[index] ? 'high' : types[index] ? 'medium' : 'low',
        });
      });
    } else if (lengths.length > 0 && result.filamentUsages.length === 0) {
      // Estimate weight from length if no weight data (assuming 1.75mm filament, ~3g per meter for PLA)
      lengths.forEach((length, index) => {
        const estimatedWeight = length * 3; // Rough estimate
        result.filamentUsages.push({
          weightGrams: estimatedWeight,
          lengthMeters: length,
          material: types[index]?.split(' ')[0],
          type: types[index],
          colorHex: colors[index],
          matchConfidence: 'low',
        });
      });
    }

    if (result.filamentUsages.length === 0) {
      result.parseErrors.push('No filament usage data found in G-code');
    }

  } catch (error) {
    result.parseErrors.push(`Failed to parse G-code file: ${error}`);
  }

  return result;
}

/**
 * Filament data structure from slice_info.config
 */
interface SliceInfoFilament {
  color?: string;
  color_code?: string;
  type?: string;
  name?: string;
  used_g?: number;
  used_m?: number;
  product_code?: string;
}

/**
 * Slice info config data structure
 */
interface SliceInfoConfig {
  filament?: SliceInfoFilament[];
  [key: string]: unknown;
}

/**
 * Parse slice_info.config from Bambu/Orca 3MF
 */
function parseSliceInfoConfig(content: string, result: ParsedPrintFile): void {
  try {
    // This is often in a custom format, try JSON first
    const data = JSON.parse(content) as SliceInfoConfig;
    
    if (data.filament) {
      data.filament.forEach((f: SliceInfoFilament) => {
        result.filamentUsages.push({
          color: f.color as string,
          colorHex: f.color_code as string,
          material: f.type as string,
          type: f.name as string,
          weightGrams: (f.used_g as number) || 0,
          lengthMeters: f.used_m as number,
          productCode: f.product_code as string,
          matchConfidence: 'high',
        });
      });
    }

    if (data.print_time) {
      result.printTime = typeof data.print_time === 'number' ? data.print_time : undefined;
    }

    if (data.project_name) {
      result.projectName = typeof data.project_name === 'string' ? data.project_name : undefined;
    }
  } catch {
    // Not JSON, try line-by-line parsing
    parseKeyValueConfig(content, result);
  }
}

/**
 * Parse project_settings.config
 */
function parseProjectSettings(content: string, result: ParsedPrintFile): void {
  try {
    const data = JSON.parse(content);
    if (data.name) {
      result.projectName = data.name;
    }
  } catch {
    // Ignore parsing errors for project settings
  }
}

/**
 * Parse plate JSON files (Bambu sliced format)
 */
function parsePlateJson(content: string, result: ParsedPrintFile): void {
  try {
    const data = JSON.parse(content);
    
    // Look for filament usage in various locations
    if (data.filament_used_g) {
      const weights = Array.isArray(data.filament_used_g) 
        ? data.filament_used_g 
        : [data.filament_used_g];
      
      const types = data.filament_type || [];
      const colors = data.filament_colour || [];
      
      weights.forEach((weight: number, index: number) => {
        if (weight > 0) {
          result.filamentUsages.push({
            weightGrams: weight,
            material: types[index]?.split(' ')[0],
            type: types[index],
            colorHex: colors[index],
            matchConfidence: types[index] ? 'medium' : 'low',
          });
        }
      });
    }

    if (data.print_time) {
      result.printTime = data.print_time;
    }
  } catch {
    // Ignore JSON parse errors
  }
}

/**
 * Parse plate config files
 */
function parsePlateConfig(content: string, result: ParsedPrintFile): void {
  parseKeyValueConfig(content, result);
}

/**
 * Parse key=value style config files
 */
function parseKeyValueConfig(content: string, result: ParsedPrintFile): void {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    switch (key?.trim().toLowerCase()) {
      case 'filament_used_g':
      case 'filament used [g]':
        value.split(',').forEach((v, i) => {
          const weight = parseFloat(v.trim());
          if (!isNaN(weight) && weight > 0) {
            if (result.filamentUsages[i]) {
              result.filamentUsages[i].weightGrams = weight;
            } else {
              result.filamentUsages.push({ weightGrams: weight, matchConfidence: 'low' });
            }
          }
        });
        break;
      
      case 'filament_type':
        value.split(',').forEach((v, i) => {
          const type = v.trim();
          if (type) {
            if (result.filamentUsages[i]) {
              result.filamentUsages[i].type = type;
              result.filamentUsages[i].material = type.split(' ')[0];
              result.filamentUsages[i].matchConfidence = 'medium';
            }
          }
        });
        break;
      
      case 'filament_colour':
        value.split(',').forEach((v, i) => {
          const color = v.trim();
          if (color) {
            if (result.filamentUsages[i]) {
              result.filamentUsages[i].colorHex = color;
              if (result.filamentUsages[i].type) {
                result.filamentUsages[i].matchConfidence = 'high';
              }
            }
          }
        });
        break;

      case 'print_time':
        const time = parseInt(value, 10);
        if (!isNaN(time)) {
          result.printTime = time;
        }
        break;
    }
  }
}

/**
 * Parse print time string (e.g., "1h 30m 45s" or "5400")
 */
function parsePrintTime(timeStr: string): number {
  // If it's just a number, return as seconds
  const numericValue = parseFloat(timeStr);
  if (!isNaN(numericValue) && timeStr.match(/^\d+$/)) {
    return numericValue;
  }

  // Parse time format like "1h 30m 45s" or "1d 2h 30m"
  let totalSeconds = 0;
  
  const daysMatch = timeStr.match(/(\d+)\s*d/i);
  if (daysMatch) totalSeconds += parseInt(daysMatch[1], 10) * 86400;
  
  const hoursMatch = timeStr.match(/(\d+)\s*h/i);
  if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  
  const minutesMatch = timeStr.match(/(\d+)\s*m/i);
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  
  const secondsMatch = timeStr.match(/(\d+)\s*s/i);
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);

  return totalSeconds || 0;
}

/**
 * Main function to parse any print file type
 */
export async function parsePrintFile(file: File): Promise<ParsedPrintFile> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case '3mf':
      return parse3MFFile(file);
    case 'gcode':
    case 'gco':
      return parseGCodeFile(file);
    default:
      return {
        filename: file.name,
        filamentUsages: [],
        parseErrors: [`Unsupported file format: ${extension}. Please use 3MF or G-code files.`],
      };
  }
}

