"""
Tests unitarios para el rate limiter.
Puro Python — no usa HTTP ni mocks externos.
"""
import pytest
import app.api.rate_limiter as rl


@pytest.fixture(autouse=True)
def reset_counts():
    """Limpia el estado global entre tests para evitar interferencias."""
    rl._counts.clear()
    yield
    rl._counts.clear()


class TestCheckAndIncrement:
    def test_first_request_is_allowed(self):
        assert rl.check_and_increment("user-1", limit=5) is True

    def test_requests_within_limit_are_allowed(self):
        for _ in range(5):
            assert rl.check_and_increment("user-1", limit=5) is True

    def test_request_over_limit_is_blocked(self):
        for _ in range(5):
            rl.check_and_increment("user-1", limit=5)
        assert rl.check_and_increment("user-1", limit=5) is False

    def test_different_users_have_independent_counters(self):
        for _ in range(5):
            rl.check_and_increment("user-a", limit=5)
        # user-a agotó su límite, user-b aún tiene cupo
        assert rl.check_and_increment("user-a", limit=5) is False
        assert rl.check_and_increment("user-b", limit=5) is True

    def test_limit_of_one_blocks_on_second_request(self):
        assert rl.check_and_increment("user-1", limit=1) is True
        assert rl.check_and_increment("user-1", limit=1) is False

    def test_window_minute(self):
        assert rl.check_and_increment("user-1", limit=3, window="minute") is True
        assert rl.check_and_increment("user-1", limit=3, window="minute") is True
        assert rl.check_and_increment("user-1", limit=3, window="minute") is True
        assert rl.check_and_increment("user-1", limit=3, window="minute") is False

    def test_window_hour(self):
        assert rl.check_and_increment("user-1", limit=2, window="hour") is True
        assert rl.check_and_increment("user-1", limit=2, window="hour") is True
        assert rl.check_and_increment("user-1", limit=2, window="hour") is False
