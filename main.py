import os
import json
import tempfile
import zipfile
import shutil
import urllib.request
import ssl
import asyncio
import subprocess
from concurrent.futures import ThreadPoolExecutor
import decky_plugin

SETTINGS_FILE = os.path.join(decky_plugin.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")

DEFAULT_SETTINGS = {
    "gateway_url": "",
    "gateway_api_key": "",
    "refresh_interval_seconds": 120,
    "show_regions": True,
    "show_history": True,
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

    async def test_backend(self) -> dict:
        """Simple test method to verify backend is working."""
        decky_plugin.logger.info("[test_backend] Called!")
        return {"success": True, "message": "Backend is working!"}

    async def restart_decky(self) -> dict:
        """Restart Decky Loader service."""
        decky_plugin.logger.info("[restart_decky] Restarting Decky Loader...")
        try:
            # Decky Loader runs as a system service, needs sudo
            # Use a small delay so the response can be sent before restart
            subprocess.Popen(
                ["bash", "-c", "sleep 1 && sudo systemctl restart plugin_loader"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            return {"success": True}
        except Exception as e:
            decky_plugin.logger.error(f"[restart_decky] Failed: {e}")
            return {"success": False, "error": str(e)}

    async def install_plugin(self, url: str) -> dict:
        """
        Download and install plugin update from URL.
        Returns dict with success status and message.
        """
        decky_plugin.logger.info(f"[install_plugin] Called with URL: {url}")
        temp_dir = None

        try:
            # Create temp directory for download
            temp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(temp_dir, "plugin.zip")
            decky_plugin.logger.info(f"[install_plugin] Temp dir: {temp_dir}")

            # Download the zip file in a thread to not block the event loop
            decky_plugin.logger.info("[install_plugin] Starting download...")

            def do_download():
                decky_plugin.logger.info("[install_plugin] Download thread started")
                # Create SSL context that doesn't verify certificates (needed on Steam Deck)
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE

                # Use urlopen with custom SSL context
                with urllib.request.urlopen(url, context=ssl_context) as response:
                    with open(zip_path, 'wb') as f:
                        f.write(response.read())
                decky_plugin.logger.info("[install_plugin] Download thread finished")

            # Run blocking download in thread pool
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor() as executor:
                await loop.run_in_executor(executor, do_download)

            decky_plugin.logger.info(f"[install_plugin] Download complete: {zip_path}")

            # Verify file exists and has content
            if not os.path.exists(zip_path):
                raise Exception("Downloaded file not found")

            file_size = os.path.getsize(zip_path)
            decky_plugin.logger.info(f"[install_plugin] File size: {file_size} bytes")

            if file_size == 0:
                raise Exception("Downloaded file is empty")

            # Validate and extract the zip
            decky_plugin.logger.info("[install_plugin] Validating zip file...")
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Test zip integrity
                    bad_file = zip_ref.testzip()
                    if bad_file is not None:
                        raise Exception(f"Corrupt file in zip: {bad_file}")
                    decky_plugin.logger.info("[install_plugin] Zip file is valid")
            except zipfile.BadZipFile:
                raise Exception("Installation verification failed: Invalid zip file")

            decky_plugin.logger.info("[install_plugin] Extracting...")
            extract_dir = os.path.join(temp_dir, "extracted")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # Find the plugin source directory
            extracted_items = os.listdir(extract_dir)
            decky_plugin.logger.info(f"[install_plugin] Extracted items: {extracted_items}")

            if len(extracted_items) == 1 and os.path.isdir(os.path.join(extract_dir, extracted_items[0])):
                plugin_source = os.path.join(extract_dir, extracted_items[0])
            else:
                plugin_source = extract_dir

            # Validate required files exist and have content
            decky_plugin.logger.info("[install_plugin] Validating extracted files...")
            required_files = [
                ('main.py', 100),  # (filename, minimum size in bytes)
                ('dist/index.js', 100),
            ]
            for filename, min_size in required_files:
                filepath = os.path.join(plugin_source, filename)
                if not os.path.exists(filepath):
                    raise Exception(f"Installation verification failed: Missing required file {filename}")
                file_size = os.path.getsize(filepath)
                if file_size < min_size:
                    raise Exception(f"Installation verification failed: {filename} is too small ({file_size} bytes)")
                decky_plugin.logger.info(f"[install_plugin] Validated {filename}: {file_size} bytes")

            decky_plugin.logger.info("[install_plugin] All files validated successfully")

            # Get the target plugin directory
            plugin_dir = decky_plugin.DECKY_PLUGIN_DIR
            decky_plugin.logger.info(f"[install_plugin] Installing to: {plugin_dir}")

            # Copy individual files (not directories) - this works even with root ownership
            # Note: plugin.json is owned by root and shouldn't change between versions
            files_to_copy = ['main.py', 'LICENSE']
            for filename in files_to_copy:
                src = os.path.join(plugin_source, filename)
                dst = os.path.join(plugin_dir, filename)
                if os.path.exists(src):
                    decky_plugin.logger.info(f"[install_plugin] Copying {filename}...")
                    with open(src, 'rb') as f_src:
                        content = f_src.read()
                    with open(dst, 'wb') as f_dst:
                        f_dst.write(content)
                    decky_plugin.logger.info(f"[install_plugin] Copied {filename}")

            # Copy files within dist/
            src_dist = os.path.join(plugin_source, 'dist')
            dst_dist = os.path.join(plugin_dir, 'dist')
            if os.path.exists(src_dist) and os.path.isdir(src_dist):
                for filename in os.listdir(src_dist):
                    src = os.path.join(src_dist, filename)
                    dst = os.path.join(dst_dist, filename)
                    if os.path.isfile(src):
                        decky_plugin.logger.info(f"[install_plugin] Copying dist/{filename}...")
                        with open(src, 'rb') as f_src:
                            content = f_src.read()
                        with open(dst, 'wb') as f_dst:
                            f_dst.write(content)
                        decky_plugin.logger.info(f"[install_plugin] Copied dist/{filename}")

            # Cleanup temp directory
            shutil.rmtree(temp_dir)
            temp_dir = None

            decky_plugin.logger.info("[install_plugin] SUCCESS!")
            return {
                "success": True,
                "message": "Update installed! Please restart Decky Loader."
            }

        except Exception as e:
            decky_plugin.logger.error(f"[install_plugin] FAILED: {e}")
            import traceback
            decky_plugin.logger.error(f"[install_plugin] Traceback: {traceback.format_exc()}")
            # Cleanup on error
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
            return {
                "success": False,
                "message": str(e)
            }
