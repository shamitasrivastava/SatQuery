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
 * Decodes client-side GeoTIFF or standard raster files into displayable data URLs.
 */
export const processRaster = async (file: File): Promise<string> => {
  try {
    if (file.name.endsWith('.tif') || file.name.endsWith('.tiff')) {
      const arrayBuffer = await file.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const width = image.getWidth();
      const height = image.getHeight();
      const numBands = image.getSamplesPerPixel ? image.getSamplesPerPixel() : 3;

      if (numBands === 1 || numBands === 3 || numBands === 4) {
        try {
          const rgb = await image.readRGB({ interleave: true });
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const imgData = ctx.createImageData(width, height);
            for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
              imgData.data[i] = rgb[j];
              imgData.data[i + 1] = rgb[j + 1];
              imgData.data[i + 2] = rgb[j + 2];
              imgData.data[i + 3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
            return canvas.toDataURL('image/png');
          }
        } catch (rgbErr) {
          console.warn('GeoTIFF readRGB skipped (multi-band or float32):', rgbErr);
        }
      }
    }
  } catch (err) {
    console.warn('processRaster could not parse GeoTIFF locally, using object URL:', err);
  }
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
