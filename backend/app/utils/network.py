from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


_BLOCKED_HOSTNAMES = {"localhost", "localhost.localdomain"}
_BLOCKED_IPS = {
    ipaddress.ip_address("169.254.169.254"),  # AWS/GCP/Azure metadata
}
_BLOCK_MESSAGE = "Webhook URL must not target localhost or private network addresses"


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


def validate_public_url(url: str, *, allow_private: bool = False) -> str:
    if allow_private:
        return url

    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        raise ValueError("Webhook URL is missing a host")

    if host.lower() in _BLOCKED_HOSTNAMES:
        raise ValueError(_BLOCK_MESSAGE)

    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        try:
            resolved = socket.getaddrinfo(
                host,
                parsed.port or (443 if parsed.scheme == "https" else 80),
                type=socket.SOCK_STREAM,
            )
        except socket.gaierror:
            return url

        for _, _, _, _, sockaddr in resolved:
            candidate = ipaddress.ip_address(sockaddr[0])
            if _is_blocked_ip(candidate):
                raise ValueError(_BLOCK_MESSAGE)
        return url

    if _is_blocked_ip(ip):
        raise ValueError(_BLOCK_MESSAGE)

    return url
