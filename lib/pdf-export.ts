/**
 * PDF Export Utility
 * Converts dashboard evaluation report to downloadable PDF
 */

import type { ProductEvaluation } from "@/types";

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

const OKLAB_REGEX = /oklab\([^)]*\)/gi;
const OKLCH_REGEX = /oklch\([^)]*\)/gi;
const COLOR_PROPERTIES_TO_NORMALIZE = [
  "color",
  "background",
  "background-color",
  "background-image",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "box-shadow",
  "--tw-gradient-from",
  "--tw-gradient-via",
  "--tw-gradient-to",
  "--tw-gradient-stops",
];

/**
 * No longer needed - Tailwind colors are now RGB/HSL, not OKLCH
 * Keeping this simple function for potential future use
 */

/**
 * Generate and download PDF from a DOM element
 */
export async function exportToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `evaluation-report-${new Date().getTime()}.pdf`,
    quality = 0.95,
    scale = 2,
  } = options;

  try {
    console.log("Generating PDF...");

    // Dynamically import jsPDF and html2canvas (browser-only libraries)
    const jsPDF = (await import("jspdf")).default;
    const html2canvas = (await import("html2canvas")).default;

    console.log("Converting element to canvas...");

    // Detect if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    const backgroundColor = isDarkMode ? "#09090b" : "#ffffff"; // Dark mode: neutral-950, Light mode: white

    console.log(`Using ${isDarkMode ? 'dark' : 'light'} mode for PDF`);

    // Convert HTML to canvas - preserve current theme
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: backgroundColor,
      windowWidth: 1400,
      windowHeight: element.scrollHeight,
      ignoreElements: (el: Element) => {
        // Exclude elements marked with data-pdf-exclude (website screenshots)
        if (el instanceof HTMLElement && el.getAttribute('data-pdf-exclude') === 'true') {
          return true;
        }
        return false;
      },
      onclone: (clonedDoc: Document) => {
        try {
          // Ensure dark mode class is preserved in cloned document
          if (isDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
          }

          // Fix color rendering for canvas
          clonedDoc.querySelectorAll("*").forEach((el) => {
            if (el instanceof HTMLElement) {
              try {
                normalizeElementColors(el, clonedDoc);
              } catch (error) {
                // Silently skip elements that fail to normalize
              }
            }
          });
        } catch (error) {
          console.warn('Error in onclone callback:', error);
        }
      },
    });

    console.log("Creating PDF document...");

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // Add first page
    // Use JPEG format for better compatibility with jspdf 3.x (PNG has known issues)
    // High quality (0.95) preserves visual quality while ensuring reliable PDF generation
    const imgData = canvas.toDataURL("image/jpeg", quality);
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename);
    console.log("✅ PDF generated successfully!");
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

/**
 * Generate PDF as a Blob (for sharing via Web Share API)
 */
export async function generatePDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    filename = `evaluation-report-${new Date().getTime()}.pdf`,
    quality = 0.95,
    scale = 2,
  } = options;

  try {
    console.log("Generating PDF Blob...");

    // Dynamically import libraries
    const jsPDF = (await import("jspdf")).default;
    const html2canvas = (await import("html2canvas")).default;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const backgroundColor = isDarkMode ? "#09090b" : "#ffffff";

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: backgroundColor,
      windowWidth: 1400,
      windowHeight: element.scrollHeight,
      ignoreElements: (el: Element) => {
        // Exclude elements marked with data-pdf-exclude (website screenshots)
        if (el instanceof HTMLElement && el.getAttribute('data-pdf-exclude') === 'true') {
          return true;
        }
        return false;
      },
      onclone: (clonedDoc: Document) => {
        try {
          if (isDarkMode) {
            clonedDoc.documentElement.classList.add('dark');
          }

          clonedDoc.querySelectorAll("*").forEach((el) => {
            if (el instanceof HTMLElement) {
              try {
                normalizeElementColors(el, clonedDoc);
              } catch (error) {
                // Silently skip elements that fail to normalize
              }
            }
          });
        } catch (error) {
          console.warn('Error in onclone callback:', error);
        }
      },
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // Add pages
    // Use JPEG format for better compatibility with jspdf 3.x (PNG has known issues)
    const imgData = canvas.toDataURL("image/jpeg", quality);
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert to Blob
    const pdfBlob = pdf.output("blob");
    console.log("✅ PDF Blob generated successfully!");

    return { blob: pdfBlob, filename };
  } catch (error) {
    console.error("❌ Error generating PDF Blob:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

/**
 * Generate a shareable summary for social media
 */
export function generateSocialMediaSummary(evaluation: ProductEvaluation): string {
  const { url, overallScore, buyingIntentProbability, purchaseIntentAnchor } = evaluation;

  const emoji = purchaseIntentAnchor === "high" ? "🟢" : purchaseIntentAnchor === "middle" ? "🟡" : "🔴";

  return `${emoji} Product Evaluation Report
🎯 Overall Score: ${overallScore}/100
💰 Purchase Intent: ${buyingIntentProbability}%
📊 Anchor: ${purchaseIntentAnchor.toUpperCase()}

Evaluated with 2031ai 🤖
${url}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Generate Twitter share URL
 */
export function generateTwitterShareURL(evaluation: ProductEvaluation): string {
  const summary = generateSocialMediaSummary(evaluation);
  const text = encodeURIComponent(summary);
  return `https://twitter.com/intent/tweet?text=${text}`;
}

/**
 * Generate LinkedIn share URL
 */
export function generateLinkedInShareURL(evaluation: ProductEvaluation): string {
  const summary = generateSocialMediaSummary(evaluation);
  const url = encodeURIComponent(evaluation.url);
  const title = encodeURIComponent("Product Evaluation Report");
  const description = encodeURIComponent(summary);

  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

/**
 * Generate WhatsApp share URL
 */
export function generateWhatsAppShareURL(evaluation: ProductEvaluation): string {
  const summary = generateSocialMediaSummary(evaluation);
  const text = encodeURIComponent(summary);
  return `https://wa.me/?text=${text}`;
}

function normalizeElementColors(element: HTMLElement, doc: Document) {
  const view = doc.defaultView;
  if (!view) {
    return;
  }

  const computed = view.getComputedStyle(element);

  COLOR_PROPERTIES_TO_NORMALIZE.forEach((property) => {
    try {
      const value = computed.getPropertyValue(property);
      if (!value || !containsUnsupportedColor(value)) {
        return;
      }

      const normalized = replaceUnsupportedColorFunctions(value);
      if (normalized === value) {
        return;
      }

      element.style.setProperty(property, normalized, 'important');
    } catch (error) {
      // Silently skip properties that fail to normalize
      console.warn(`Failed to normalize ${property}:`, error);
    }
  });
}

function containsUnsupportedColor(value: string): boolean {
  return value.includes("oklab") || value.includes("oklch");
}

function replaceUnsupportedColorFunctions(value: string): string {
  let result = value;
  try {
    result = result.replace(OKLCH_REGEX, (match) => {
      try {
        return convertOklchToRgba(match) ?? match;
      } catch (error) {
        console.warn('Failed to convert oklch color:', match, error);
        return 'rgb(128, 128, 128)'; // Fallback to gray
      }
    });
    result = result.replace(OKLAB_REGEX, (match) => {
      try {
        return convertOklabToRgba(match) ?? match;
      } catch (error) {
        console.warn('Failed to convert oklab color:', match, error);
        return 'rgb(128, 128, 128)'; // Fallback to gray
      }
    });
  } catch (error) {
    console.warn('Failed to replace unsupported color functions:', error);
    return value;
  }
  return result;
}

function convertOklabToRgba(input: string): string | null {
  const content = input.slice(input.indexOf("(") + 1, input.lastIndexOf(")"));
  const parts = splitOklParameters(content);
  if (!parts) {
    return null;
  }

  const { values, alpha } = parts;
  if (values.length < 3) {
    return null;
  }

  const l = parseOklComponent(values[0], true);
  const a = parseOklComponent(values[1]);
  const b = parseOklComponent(values[2]);
  if (l === null || a === null || b === null) {
    return null;
  }

  return formatRgba(oklabToRgb(l, a, b), alpha);
}

function convertOklchToRgba(input: string): string | null {
  const content = input.slice(input.indexOf("(") + 1, input.lastIndexOf(")"));
  const parts = splitOklParameters(content);
  if (!parts) {
    return null;
  }

  const { values, alpha } = parts;
  if (values.length < 3) {
    return null;
  }

  const l = parseOklComponent(values[0], true);
  const c = parseOklComponent(values[1]);
  const hValue = parseFloat(values[2]);

  if (Number.isNaN(hValue) || l === null || c === null) {
    return null;
  }

  const radians = (hValue * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);

  return formatRgba(oklabToRgb(l, a, b), alpha);
}

function splitOklParameters(content: string): { values: string[]; alpha: number } | null {
  const segments = content.split("/");
  const values = segments[0]
    .trim()
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!values.length) {
    return null;
  }

  const alphaSegment = segments[1];
  const alpha = alphaSegment ? parseAlphaComponent(alphaSegment.trim()) : 1;

  return { values, alpha };
}

function parseOklComponent(value: string, isLightness = false): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const isPercentage = trimmed.endsWith("%");
  const numeric = parseFloat(isPercentage ? trimmed.slice(0, -1) : trimmed);

  if (Number.isNaN(numeric)) {
    return null;
  }

  if (isPercentage) {
    return clamp(numeric / 100, 0, isLightness ? 1 : Infinity);
  }

  if (isLightness && numeric > 1) {
    return clamp(numeric / 100, 0, 1);
  }

  return numeric;
}

function parseAlphaComponent(value: string): number {
  const trimmed = value.trim();
  const isPercentage = trimmed.endsWith("%");
  const numeric = parseFloat(isPercentage ? trimmed.slice(0, -1) : trimmed);

  if (Number.isNaN(numeric)) {
    return 1;
  }

  if (isPercentage) {
    return clamp(numeric / 100, 0, 1);
  }

  if (numeric > 1) {
    return clamp(numeric / 100, 0, 1);
  }

  return clamp(numeric, 0, 1);
}

function oklabToRgb(l: number, a: number, b: number): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return [srgbTransfer(r), srgbTransfer(g), srgbTransfer(bVal)];
}

function srgbTransfer(value: number): number {
  const clamped = clamp(value, 0, 1);
  if (clamped <= 0.0031308) {
    return clamp(12.92 * clamped, 0, 1);
  }
  return clamp(1.055 * Math.pow(clamped, 1 / 2.4) - 0.055, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatRgba([r, g, b]: [number, number, number], alpha: number): string {
  const red = Math.round(clamp(r, 0, 1) * 255);
  const green = Math.round(clamp(g, 0, 1) * 255);
  const blue = Math.round(clamp(b, 0, 1) * 255);
  const normalizedAlpha = clamp(alpha, 0, 1);

  if (normalizedAlpha >= 1) {
    return `rgb(${red}, ${green}, ${blue})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${Number(normalizedAlpha.toFixed(3))})`;
}
