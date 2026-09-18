import * as GeoTIFF from 'geotiff';
import { API_BASE_URL } from './api';

/**
 * Normalizes backend media paths, base64 strings, or absolute URLs.
 */
export const formatMediaUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/media/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  if (trimmed.startsWith('media/')) {
    return `${API_BASE_URL}/${trimmed}`;
  }
  if (
    trimmed.startsWith('iVBOR') ||
    trimmed.startsWith('/9j/') ||
    trimmed.startsWith('R0lGO') ||
    trimmed.startsWith('UklGR') ||
    (trimmed.length > 50 && !trimmed.startsWith('/') && !trimmed.startsWith('.') && !trimmed.includes(' '))
  ) {
    return `data:image/png;base64,${trimmed}`;
  }
  return trimmed;
};

/**
 * Computes 2% and 98% percentile stretch bounds for satellite raster values.
 * Removes extreme outliers (clouds, specular spikes) and enhances visual contrast.
 */
function computeStretchBounds(band: ArrayLike<number>, sampleSize = 3000): { min: number; max: number } {
  const step = Math.max(1, Math.floor(band.length / sampleSize));
  const samples: number[] = [];
  for (let i = 0; i < band.length; i += step) {
    const v = band[i];
    if (Number.isFinite(v) && !Number.isNaN(v) && v !== 0) {
      samples.push(v);
    }
  }
  if (samples.length === 0) return { min: 0, max: 255 };
  samples.sort((a, b) => a - b);
  const min = samples[Math.floor(samples.length * 0.02)] ?? samples[0];
  const max = samples[Math.floor(samples.length * 0.98)] ?? samples[samples.length - 1];
  return { min, max: max <= min ? min + 1 : max };
}

/**
 * Generates an SVG data URL preview card if TIFF decoding encounters unsupported encodings.
 */
function createTiffFallbackCard(filename: string, fileSize?: number): string {
  const sizeMb = fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : 'GeoTIFF';
  const truncated = filename.length > 20 ? filename.slice(0, 18) + '...' : filename;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="20" fill="#0f172a"/>
    <circle cx="100" cy="80" r="32" fill="#0284c7" opacity="0.2"/>
    <path d="M85 70h30v20H85z M75 80h50v2H75z M75 90h50v2H75z" stroke="#38bdf8" stroke-width="2" fill="none"/>
    <circle cx="100" cy="80" r="14" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="3,3"/>
    <text x="100" y="130" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="bold" font-family="sans-serif">${truncated}</text>
    <rect x="65" y="145" width="70" height="18" rx="9" fill="#1e293b"/>
    <text x="100" y="158" text-anchor="middle" fill="#38bdf8" font-size="10" font-weight="600" font-family="sans-serif">${sizeMb}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Decodes client-side GeoTIFF or standard raster files into displayable PNG data URLs.
 * Supports 1-band (SAR/Panchromatic), 2-band, 3-band RGB, and multi-band Sentinel/Landsat
 * with automatic contrast stretching (uint8, uint16, float32) and preview downsampling.
 */
export const processRaster = async (file: File): Promise<string> => {
  const isTiff = file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');

  if (isTiff) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const origWidth = image.getWidth();
      const origHeight = image.getHeight();

      // Downsample large rasters to max 1024px to decode rapidly without memory lag
      const maxDim = 1024;
      let targetWidth = origWidth;
      let targetHeight = origHeight;
      if (origWidth > maxDim || origHeight > maxDim) {
        const scale = Math.min(maxDim / origWidth, maxDim / origHeight);
        targetWidth = Math.max(1, Math.round(origWidth * scale));
        targetHeight = Math.max(1, Math.round(origHeight * scale));
      }

      // Read raw raster bands (supports uint8, uint16, float32, multi-band)
      const rasters = (await image.readRasters({
        width: targetWidth,
        height: targetHeight,
        interleave: false
      })) as unknown as ArrayLike<number>[];

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx && rasters && rasters.length > 0) {
        const imgData = ctx.createImageData(targetWidth, targetHeight);
        const totalPixels = targetWidth * targetHeight;
        const numBands = rasters.length;

        if (numBands >= 3) {
          // Multi-band or RGB (e.g. Sentinel-2 Red=B4, Green=B3, Blue=B2)
          const rBand = rasters[0];
          const gBand = rasters[1];
          const bBand = rasters[2];

          const rBounds = computeStretchBounds(rBand);
          const gBounds = computeStretchBounds(gBand);
          const bBounds = computeStretchBounds(bBand);

          for (let i = 0; i < totalPixels; i++) {
            const rNorm = Math.min(255, Math.max(0, Math.round(((rBand[i] - rBounds.min) / (rBounds.max - rBounds.min)) * 255)));
            const gNorm = Math.min(255, Math.max(0, Math.round(((gBand[i] - gBounds.min) / (gBounds.max - gBounds.min)) * 255)));
            const bNorm = Math.min(255, Math.max(0, Math.round(((bBand[i] - bBounds.min) / (bBounds.max - bBounds.min)) * 255)));

            const px = i * 4;
            imgData.data[px] = rNorm;
            imgData.data[px + 1] = gNorm;
            imgData.data[px + 2] = bNorm;
            imgData.data[px + 3] = 255;
          }
        } else if (numBands === 2) {
          // Dual-polarization SAR (e.g. VV + VH)
          const b1 = rasters[0];
          const b2 = rasters[1];
          const b1Bounds = computeStretchBounds(b1);
          const b2Bounds = computeStretchBounds(b2);

          for (let i = 0; i < totalPixels; i++) {
            const v1 = Math.min(255, Math.max(0, Math.round(((b1[i] - b1Bounds.min) / (b1Bounds.max - b1Bounds.min)) * 255)));
            const v2 = Math.min(255, Math.max(0, Math.round(((b2[i] - b2Bounds.min) / (b2Bounds.max - b2Bounds.min)) * 255)));
            const avg = Math.round((v1 + v2) / 2);

            const px = i * 4;
            imgData.data[px] = v1;
            imgData.data[px + 1] = v2;
            imgData.data[px + 2] = avg;
            imgData.data[px + 3] = 255;
          }
        } else {
          // Single-band (Panchromatic, Grayscale SAR, Elevation/DEM)
          const band = rasters[0];
          const bounds = computeStretchBounds(band);

          for (let i = 0; i < totalPixels; i++) {
            const gray = Math.min(255, Math.max(0, Math.round(((band[i] - bounds.min) / (bounds.max - bounds.min)) * 255)));

            const px = i * 4;
            imgData.data[px] = gray;
            imgData.data[px + 1] = gray;
            imgData.data[px + 2] = gray;
            imgData.data[px + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
      }
    } catch (err) {
      console.warn('GeoTIFF decoding failed, generating fallback preview:', err);
      return createTiffFallbackCard(file.name, file.size);
    }
  }

  // Standard formats (PNG, JPEG, WebP) natively supported by browser
  return URL.createObjectURL(file);
};

/**
 * Helper to extract and format change mask or thematic overlay from evidence dictionaries.
 */
export const extractMaskFromEvidence = (evidence?: Record<string, any> | null): string | null => {
  if (!evidence) return null;
  const raw =
    evidence.mask_base64 ||
    evidence.change_mask ||
    evidence.change_mask_url ||
    evidence.mask ||
    evidence.binary_mask ||
    evidence.overlay_base64 ||
    evidence.evidence_base64;
  return formatMediaUrl(raw);
};
