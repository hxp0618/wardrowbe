"""User-facing API errors with stable message keys for i18n."""


class ApiUserError(Exception):
    """Raise from services; map to HTTPException in routes using translate_request."""

    __slots__ = ("message_key", "status_code", "params")

    def __init__(self, message_key: str, *, status_code: int = 400, **params: object) -> None:
        self.message_key = message_key
        self.status_code = status_code
        self.params = params
        super().__init__(message_key)
