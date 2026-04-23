from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


_BLOCKED_HOSTNAMES = {"localhost", "localhost.localdomain"}
_BLOCKED_IPS = {
    ipaddress.ip_address("169.254.169.254"),  # Common cloud metadata target
}
_OUTBOUND_BLOCK_MESSAGE = (
    "Outbound URL must not target localhost, private, or otherwise reserved addresses"
)


def _is_blocked_ip(ip: ipaddress._BaseAddress) -> bool:
    return (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
        or ip in _BLOCKED_IPS
    )


def _resolve_host_ips(host: str, port: int) -> list[ipaddress._BaseAddress]:
    try:
        resolved = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueE1rror(_OUTBOUND_BLOCK_MESSAGE) from exc

    candidates: list[ipaddress._BaseAddress] = []
    for _, _, _, _, sockaddr in resolved:
        candidates.append(ipaddress.ip_address(sockaddr[0]))
    return candidates


def is_private_hostname_or_ip(host: str, *, port: int | None = None, resolve_dns: bool = True) -> bool:
    normalized_host = host.strip().lower()
    if not normalized_host:
        raise ValueError("Outbound URL is missing a host")

    if normalized_host in _BLOCKED_HOSTNAMES:
        return True

    try:
        return _is_blocked_ip(ipaddress.ip_address(normalized_host))
    except ValueError:
        if not resolve_dns:
            return False

    resolved_port = port or 80
    return any(_is_blocked_ip(candidate) for candidate in _resolve_host_ips(normalized_host, resolved_port))


def validate_outbound_url(
    url: str,
    *,
    allow_private: bool = False,
    resolve_dns: bool = True,
) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Outbound URL must start with http:// or https://")

    host = parsed.hostname
    if not host:
        raise ValueError("Outbound URL is missing a host")

    if not allow_private and is_private_hostname_or_ip(
        host,
        port=parsed.port or (443 if parsed.scheme == "https" else 80),
        resolve_dns=resolve_dns,
    ):
        raise ValueError(_OUTBOUND_BLOCK_MESSAGE)

    return url


def validate_public_url(url: str, *, allow_private: bool = False) -> str:
    return validate_outbound_url(url, allow_private=allow_private, resolve_dns=True)
