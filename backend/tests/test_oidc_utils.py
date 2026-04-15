from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.utils.oidc import validate_oidc_id_token


class _FakeResponse:
    def __init__(self, payload: dict[str, str]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, str]:
        return self._payload


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs) -> None:
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    async def get(self, url: str) -> _FakeResponse:
        return _FakeResponse(
            {
                "jwks_uri": "https://issuer.example.com/jwks",
                "issuer": "https://issuer.example.com/",
            }
        )


@pytest.mark.asyncio
async def test_validate_oidc_id_token_uses_discovery_issuer():
    fake_jwk_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda token: SimpleNamespace(key="fake-signing-key")
    )

    with (
        patch("app.utils.oidc.httpx.AsyncClient", _FakeAsyncClient),
        patch("app.utils.oidc._get_jwk_client", return_value=fake_jwk_client),
        patch("app.utils.oidc.jwt.decode", return_value={"sub": "user-123"}) as mock_decode,
    ):
        payload = await validate_oidc_id_token(
            id_token="fake-token",
            issuer_url="https://issuer.example.com",
            client_id="client-id",
        )

    assert payload == {"sub": "user-123"}
    assert mock_decode.call_args.kwargs["issuer"] == "https://issuer.example.com/"
