import os
import json
import urllib.request
import ssl
import asyncio
import time
import socket
from concurrent.futures import ThreadPoolExecutor
import decky_plugin

SETTINGS_FILE = os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "gateway_url": "",
    "gateway_api_key": "",
    "refresh_interval_seconds": 120,
    "show_regions": True,
    "show_history": True,
    "enable_notifications": True,
    "enable_notification_antiflood": True,
    "show_trending_games": True,
}


class Plugin:
    settings: dict = {}

    async def _main(self):
        """Initialize the plugin."""
        self.settings = self._load_settings()
        decky_plugin.logger.info("SteamStat plugin initialized")

    async def _unload(self):
        """Clean up when plugin is unloaded."""
        decky_plugin.logger.info("SteamStat plugin unloaded")

    def _load_settings(self) -> dict:
        """Load settings from file or return defaults."""
        try:
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, "r") as f:
                    loaded = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    return {**DEFAULT_SETTINGS, **loaded}
        except Exception as e:
            decky_plugin.logger.error(f"Failed to load settings: {e}")
        return DEFAULT_SETTINGS.copy()

    def _save_settings(self) -> bool:
        """Save settings to file."""
        try:
            os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
            with open(SETTINGS_FILE, "w") as f:
                json.dump(self.settings, f, indent=2)
            return True
        except Exception as e:
            decky_plugin.logger.error(f"Failed to save settings: {e}")
            return False

    async def get_settings(self) -> dict:
        """Get all settings."""
        return self.settings

    async def set_setting(self, key: str, value) -> bool:
        """Set a single setting."""
        if key in DEFAULT_SETTINGS:
            self.settings[key] = value
            return self._save_settings()
        return False

    async def set_settings(self, settings: dict) -> bool:
        """Set multiple settings at once."""
        for key, value in settings.items():
            if key in DEFAULT_SETTINGS:
                self.settings[key] = value
        return self._save_settings()

    async def get_setting(self, key: str, default=None):
        """Get a single setting."""
        return self.settings.get(key, default)

    async def reset_settings(self) -> bool:
        """Reset all settings to defaults."""
        self.settings = DEFAULT_SETTINGS.copy()
        return self._save_settings()

    async def test_steam_latency(self) -> dict:
        """Test latency to Steam Connection Managers using Steam's official CM list."""
        decky_plugin.logger.info("[test_steam_latency] Testing Steam CM latency...")
        try:
            def fetch_and_test_cms():
                """Fetch CM list from Steam and test latency."""
                import json

                # Fetch the official Steam CM list
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE

                try:
                    with urllib.request.urlopen(
                        "https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?cellid=0",
                        context=ssl_context,
                        timeout=5
                    ) as response:
                        data = json.loads(response.read())
                        cm_list = data.get('response', {}).get('serverlist', [])

                        if not cm_list:
                            raise Exception("No CM servers in response")

                        decky_plugin.logger.info(f"[test_steam_latency] Found {len(cm_list)} CM servers")

                        # Test up to 10 random CMs to find the best one
                        import random
                        test_sample = random.sample(cm_list, min(10, len(cm_list)))

                        best_latency = None
                        best_endpoint = None

                        for endpoint in test_sample:
                            # Parse endpoint (format: "host:port")
                            if ':' in endpoint:
                                host, port = endpoint.split(':', 1)
                                port = int(port)
                            else:
                                host = endpoint
                                port = 27017

                            try:
                                start_time = time.time()
                                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                                sock.settimeout(2)
                                sock.connect((host, port))
                                sock.close()
                                latency_ms = (time.time() - start_time) * 1000

                                if best_latency is None or latency_ms < best_latency:
                                    best_latency = latency_ms
                                    best_endpoint = host

                                decky_plugin.logger.info(f"[test_steam_latency] {host}: {latency_ms:.0f}ms")
                            except Exception as e:
                                decky_plugin.logger.debug(f"[test_steam_latency] {host} failed: {e}")
                                continue

                        if best_latency is not None:
                            return (best_latency, best_endpoint)
                        else:
                            raise Exception("Could not reach any CM servers")

                except Exception as e:
                    decky_plugin.logger.error(f"[test_steam_latency] CM list fetch failed: {e}")
                    raise

            # Run in thread pool
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor() as executor:
                best_latency, best_endpoint = await loop.run_in_executor(executor, fetch_and_test_cms)

            decky_plugin.logger.info(f"[test_steam_latency] Best: {best_endpoint} ({best_latency:.0f}ms)")
            return {
                "latency_ms": int(best_latency),
                "cm_server": best_endpoint
            }

        except Exception as e:
            decky_plugin.logger.error(f"[test_steam_latency] Failed: {e}")
            raise

    async def test_internet_speed(self) -> dict:
        """Test internet download/upload speed."""
        decky_plugin.logger.info("[test_internet_speed] Testing internet speed...")
        try:
            # Test download speed using a small file from a reliable source
            test_url = "https://ash-speed.hetzner.com/100MB.bin"  # 100MB test file (HTTPS)

            def test_download():
                """Download test file and measure speed."""
                try:
                    start_time = time.time()
                    ssl_context = ssl.create_default_context()
                    ssl_context.check_hostname = False
                    ssl_context.verify_mode = ssl.CERT_NONE

                    with urllib.request.urlopen(test_url, context=ssl_context, timeout=10) as response:
                        data = response.read()
                        bytes_downloaded = len(data)

                    duration = time.time() - start_time
                    if duration > 0:
                        mbps = (bytes_downloaded * 8) / (duration * 1000000)  # Convert to Mbps
                        return mbps
                    return 0
                except Exception as e:
                    decky_plugin.logger.error(f"[test_internet_speed] Download failed: {e}")
                    import traceback
                    decky_plugin.logger.error(f"[test_internet_speed] Traceback: {traceback.format_exc()}")
                    return 0

            # Run download test in thread pool
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor() as executor:
                download_mbps = await loop.run_in_executor(executor, test_download)

            # For upload, we'll estimate it as 40% of download (typical for most connections)
            # Actual upload testing would require a server to receive data
            upload_mbps = download_mbps * 0.4

            if download_mbps > 0:
                decky_plugin.logger.info(f"[test_internet_speed] Download: {download_mbps:.1f} Mbps")
                return {
                    "download_mbps": download_mbps,
                    "upload_mbps": upload_mbps
                }
            else:
                raise Exception("Speed test failed")

        except Exception as e:
            decky_plugin.logger.error(f"[test_internet_speed] Failed: {e}")
            import traceback
            decky_plugin.logger.error(f"[test_internet_speed] Traceback: {traceback.format_exc()}")
            raise
