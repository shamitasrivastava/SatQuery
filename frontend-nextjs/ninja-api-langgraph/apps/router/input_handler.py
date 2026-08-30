import os
import uuid
from typing import List, Tuple, Optional
from PIL import Image
from apps.router.schemas import ImageInputMetadata, ImageFormatEnum, ImageModalityEnum


ALLOWED_EXTENSIONS = {
    ".tif": ImageFormatEnum.TIFF,
    ".tiff": ImageFormatEnum.TIFF,
    ".geotiff": ImageFormatEnum.GEOTIFF,
    ".png": ImageFormatEnum.PNG,
    ".jpg": ImageFormatEnum.JPEG,
    ".jpeg": ImageFormatEnum.JPEG,
}


class InputHandler:
    """
    Validates uploaded remote sensing imagery, inspects formats,
    extracts metadata, and prepares normalized input context.
    """

    @classmethod
    def validate_file_extension(cls, filename: str) -> Tuple[bool, ImageFormatEnum]:
        ext = os.path.splitext(filename.lower())[1]
        if ext in ALLOWED_EXTENSIONS:
            return True, ALLOWED_EXTENSIONS[ext]
        return False, ImageFormatEnum.UNKNOWN

    @classmethod
    def inspect_image(cls, file_obj_or_path, original_filename: str) -> Tuple[bool, Optional[ImageInputMetadata], str]:
        """
        Inspects an uploaded image or path, extracting dimensions and format.
        """
        is_valid_ext, fmt = cls.validate_file_extension(original_filename)
        if not is_valid_ext:
            return False, None, f"Unsupported file extension for '{original_filename}'. Allowed: GeoTIFF/TIFF, PNG, JPEG/JPG."

        try:
            with Image.open(file_obj_or_path) as img:
                width, height = img.size
                channels = len(img.getbands()) if hasattr(img, "getbands") else 3
                
                # Check modality heuristic (single-band grayscale / high dynamic range could be SAR/Elevation)
                modality = ImageModalityEnum.OPTICAL
                if channels == 1 or "sar" in original_filename.lower():
                    modality = ImageModalityEnum.SAR

                meta = ImageInputMetadata(
                    id=str(uuid.uuid4())[:8],
                    filename=original_filename,
                    format=fmt.value,
                    modality=modality.value,
                    width=width,
                    height=height,
                    channels=channels
                )
                return True, meta, "Success"
        except Exception as e:
            return False, None, f"Failed to read image data for '{original_filename}': {str(e)}"

    @classmethod
    def validate_context(cls, images: List[ImageInputMetadata]) -> Tuple[bool, str]:
        """
        Validates the overall input collection context.
        """
        if not images or len(images) == 0:
            return False, "No image provided. At least 1 satellite image is required."
        if len(images) > 4:
            return False, f"Maximum 4 images supported per request. Received {len(images)}."
        return True, "Input context valid"
