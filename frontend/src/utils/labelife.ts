/**
 * Utility functions for generating Labelife .aml files
 * Labelife uses LPAPI XML format for label templates
 * The .aml file contains a single PNG image of the entire label
 */

/**
 * Generate Labelife .aml file content
 * Based on LPAPI version 1.6 format
 * @param labelName - Name for the label file
 * @param labelWidth - Label width in mm
 * @param labelHeight - Label height in mm
 * @param imageBase64 - Base64 encoded PNG image of the entire label
 */
export function generateAmlFile(
  labelName: string,
  labelWidth: number,
  labelHeight: number,
  imageBase64: string
): string {
  const paperBackground = '#ffffff';
  const paperForeground = '#000000';
  
  // Calculate valid bounds (1mm margin on all sides)
  const validBoundsX = 1;
  const validBoundsY = 1;
  const validBoundsWidth = labelWidth - 2;
  const validBoundsHeight = labelHeight - 2;

  // Generate random IDs for the image element
  const id = Math.floor(Math.random() * 2147483647);
  const objectId = Math.floor(Math.random() * 2147483647);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<LPAPI version="1.6">
      <labelName>${escapeXml(labelName)}</labelName>
      <paperName>Custom Label</paperName>
      <isPrintHorizontal>0</isPrintHorizontal>
      <labelHeight>${labelHeight.toFixed(3)}</labelHeight>
      <labelWidth>${labelWidth.toFixed(3)}</labelWidth>
      <validBoundsX>${validBoundsX}</validBoundsX>
      <validBoundsY>${validBoundsY}</validBoundsY>
      <validBoundsWidth>${validBoundsWidth}</validBoundsWidth>
      <validBoundsHeight>${validBoundsHeight}</validBoundsHeight>
      <paperType>0</paperType>
      <paperBackground>${paperBackground}</paperBackground>
      <paperForeground>${paperForeground}</paperForeground>
      <DisplaySize_mm>${labelWidth.toFixed(2)}mm * ${labelHeight.toFixed(2)}mm</DisplaySize_mm>
      <DisplaySize_in>${(labelWidth / 25.4).toFixed(3)}inch * ${(labelHeight / 25.4).toFixed(3)}inch</DisplaySize_in>
      <isRotate180>0</isRotate180>
      <isBannerMode>0</isBannerMode>
      <isCustomSize>0</isCustomSize>
      <leftBlank>0</leftBlank>
      <rightBlank>0</rightBlank>
      <upBlank>0</upBlank>
      <downBlank>0</downBlank>
      <typeName>White-${Math.round(labelWidth)}${Math.round(labelHeight)}</typeName>
      <showDisplayMm>${labelWidth.toFixed(1)} * ${labelHeight.toFixed(1)} mm</showDisplayMm>
      <showDisplayIn>${(labelWidth / 25.4).toFixed(2)} * ${(labelHeight / 25.4).toFixed(2)} in</showDisplayIn>
      <contents>
          <WdPage>
              <masksToBoundsType>0</masksToBoundsType>
              <borderDisplay>0</borderDisplay>
              <isAutoHeight>0</isAutoHeight>
              <lineType>0</lineType>
              <borderWidth>1</borderWidth>
              <borderColor>#000000</borderColor>
              <lockMovement>0</lockMovement>
              <contents><Image>
                    <lineType>0</lineType>
                    <content>${imageBase64}</content>
                    <height>${labelHeight.toFixed(3)}</height>
                    <width>${labelWidth.toFixed(3)}</width>
                    <y>0.000</y>
                    <x>0.000</x>
                    <orientation>0.000000</orientation>
                    <lockMovement>0</lockMovement>
                    <borderDisplay>0</borderDisplay>
                    <borderHeight>0.7055555449591742</borderHeight>
                    <borderColor>#000000</borderColor>
                    <id>${id}</id>
                    <objectId>${objectId}</objectId>
                    <imageEffect>0</imageEffect>
                    <antiColor>0</antiColor>
                    <isRatioScale>1</isRatioScale>
                    <imageType>0</imageType>
                    <isMirror>0</isMirror>
                    <isRedBlack>0</isRedBlack>
                </Image></contents>
              <columnCount>0</columnCount>
                            <isRibbonLabel>0</isRibbonLabel>
          </WdPage>
    </contents>
  </LPAPI>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert canvas to PNG base64 data URL
 */
export function canvasToBase64(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    const dataUrl = canvas.toDataURL('image/png');
    // Remove data:image/png;base64, prefix
    const base64 = dataUrl.split(',')[1];
    resolve(base64);
  });
}

/**
 * Convert HTML element to canvas and then to PNG base64
 * Uses html2canvas library to render the entire label
 */
export async function elementToBase64(element: HTMLElement, width: number, height: number): Promise<string> {
  // Dynamic import to avoid bundling issues
  const html2canvas = (await import('html2canvas')).default;
  
  // Ensure all SVGs are visible and properly rendered
  const svgs = element.querySelectorAll('svg');
  svgs.forEach(svg => {
    svg.style.display = 'block';
    svg.style.visibility = 'visible';
    svg.style.opacity = '1';
  });
  
  const canvas = await html2canvas(element, {
    width: width,
    height: height,
    scale: 5, // Higher resolution for better quality (increased from 3 to 5)
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    allowTaint: false,
    imageTimeout: 15000,
    foreignObjectRendering: true, // Better SVG rendering
    onclone: (clonedDoc) => {
      // Ensure SVGs are visible in the cloned document
      const clonedSvgs = clonedDoc.querySelectorAll('svg');
      clonedSvgs.forEach(svg => {
        svg.style.display = 'block';
        svg.style.visibility = 'visible';
        svg.style.opacity = '1';
      });
    },
  });
  
  return canvasToBase64(canvas);
}

/**
 * Download .aml file
 */
export function downloadAmlFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.aml') ? filename : `${filename}.aml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

