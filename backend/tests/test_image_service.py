from base64 import b64decode

from app.services.image_service import ImageService


def test_validate_image_accepts_valid_octet_stream_upload(tmp_path):
    image_bytes = b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    image_service = ImageService(storage_path=str(tmp_path))

    assert image_service.validate_image(image_bytes, "application/octet-stream") is True
