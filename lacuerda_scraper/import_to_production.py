#!/usr/bin/env python3
"""
Production Import Script for ChoirApp - La Cuerda Songs
========================================================

This script imports scraped songs from lacuerda_songs.json into the production ChoirApp backend.

IMPORTANT SECURITY NOTES:
- This script contains production credentials
- Do NOT commit this file to version control
- Run only in secure environments
- Delete after use if needed

Usage:
    python import_to_production.py --token YOUR_JWT_TOKEN [--dry-run] [--limit N] [--start-from N]

Options:
    --token TOKEN   JWT token for authentication (required)
    --dry-run       Show what would be imported without actually doing it
    --limit N       Import only N songs (useful for testing)
    --start-from N  Start importing from song number N (useful for resuming)
"""

import requests
import json
import os
import sys
import argparse
import time
from typing import List, Dict, Any, Optional

# --- PRODUCTION CONFIGURATION ---
PRODUCTION_API_URL = "https://choirapp-backend-b7evgyahfthjf3aa.centralus-01.azurewebsites.net/api"
CREATE_SONG_ENDPOINT = f"{PRODUCTION_API_URL}/songs"
SONGS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'lacuerda_songs.json')

# Production JWT Token will be provided via command line argument

# Request configuration
REQUEST_TIMEOUT = 30  # seconds
DELAY_BETWEEN_REQUESTS = 1  # seconds to avoid overwhelming the server

class SongImporter:
    """Handles the import of songs to the production backend."""
    
    def __init__(self, jwt_token: str, api_url: str):
        self.jwt_token = jwt_token
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json",
            "User-Agent": "ChoirApp-LaCuerda-Importer/1.0"
        }
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
    
    def load_songs(self) -> List[Dict[str, Any]]:
        """Load songs from the JSON file."""
        print(f"📖 Loading songs from {SONGS_FILE_PATH}...")
        
        try:
            with open(SONGS_FILE_PATH, 'r', encoding='utf-8') as f:
                songs = json.load(f)
            
            print(f"✅ Successfully loaded {len(songs)} songs")
            return songs
            
        except FileNotFoundError:
            print(f"❌ Error: Songs file not found at {SONGS_FILE_PATH}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Error: Could not decode JSON from {SONGS_FILE_PATH}: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error loading songs: {e}")
            sys.exit(1)
    
    def convert_song_format(self, song: Dict[str, Any]) -> Dict[str, Any]:
        """Convert scraped song format to backend API format."""
        # Extract original key from chordpro content if possible
        original_key = self.extract_key_from_chordpro(song.get("chordpro", ""))
        
        return {
            "title": song.get("title", "").strip(),
            "artist": song.get("artist", "").strip(),
            "originalKey": original_key,
            "content": song.get("chordpro", "").strip(),
            "visibility": 1,  # 1 = Public (so all users can see these songs)
            "sourceUrl": song.get("source_url", "").strip()
        }
    
    def extract_key_from_chordpro(self, chordpro: str) -> str:
        """Try to extract the musical key from ChordPro content."""
        if not chordpro:
            return ""
        
        # Look for common chord patterns at the start of verses
        import re
        
        # Common chord patterns (simplified detection)
        chord_patterns = [
            r'\[([A-G][#b]?(?:m|maj|min|sus|dim|aug)?)\]',  # [C], [Dm], [F#m], etc.
        ]
        
        for pattern in chord_patterns:
            matches = re.findall(pattern, chordpro)
            if matches:
                # Return the first chord found as a guess for the key
                return matches[0]
        
        return ""
    
    def validate_song(self, song: Dict[str, Any]) -> tuple[bool, str]:
        """Validate that a song has required fields."""
        if not song.get("title"):
            return False, "Missing title"
        
        if not song.get("content"):
            return False, "Missing content"
        
        if len(song.get("title", "")) > 200:
            return False, "Title too long (max 200 characters)"
        
        if len(song.get("artist", "")) > 100:
            return False, "Artist name too long (max 100 characters)"
        
        return True, ""
    
    def import_song(self, song_data: Dict[str, Any], song_index: int, dry_run: bool = False) -> bool:
        """Import a single song to the backend."""
        converted_song = self.convert_song_format(song_data)
        
        # Validate the song
        is_valid, error_msg = self.validate_song(converted_song)
        if not is_valid:
            print(f"⚠️  Song #{song_index + 1} '{converted_song.get('title', 'Unknown')}' - SKIPPED: {error_msg}")
            self.stats["skipped"] += 1
            return False
        
        if dry_run:
            print(f"🔍 DRY RUN - Would import: '{converted_song['title']}' by {converted_song.get('artist', 'Unknown')}")
            return True
        
        try:
            print(f"📤 Importing #{song_index + 1}: '{converted_song['title']}' by {converted_song.get('artist', 'Unknown')}...")
            
            response = requests.post(
                CREATE_SONG_ENDPOINT,
                json=converted_song,
                headers=self.headers,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 201:
                print(f"✅ Successfully imported: '{converted_song['title']}'")
                self.stats["success"] += 1
                return True
            elif response.status_code == 409:
                print(f"⚠️  Song already exists: '{converted_song['title']}' - SKIPPED")
                self.stats["skipped"] += 1
                return False
            else:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = f" - {error_data.get('message', 'Unknown error')}"
                except:
                    error_detail = f" - HTTP {response.status_code}"
                
                print(f"❌ Failed to import '{converted_song['title']}'{error_detail}")
                self.stats["failed"] += 1
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ Timeout importing '{converted_song['title']}'")
            self.stats["failed"] += 1
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error importing '{converted_song['title']}': {e}")
            self.stats["failed"] += 1
            return False
        except Exception as e:
            print(f"❌ Unexpected error importing '{converted_song['title']}': {e}")
            self.stats["failed"] += 1
            return False
    
    def test_connection(self) -> bool:
        """Test connection to the production backend."""
        print("🔌 Testing connection to production backend...")
        
        try:
            # Test with a simple GET request to a health endpoint or similar
            health_url = f"{PRODUCTION_API_URL.replace('/api', '')}/api/health"
            response = requests.get(health_url, timeout=10)
            
            if response.status_code == 200:
                print("✅ Backend connection successful")
                return True
            else:
                print(f"⚠️  Backend responded with status {response.status_code}")
                return True  # Still proceed, might be auth-protected
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend connection failed: {e}")
            return False
    
    def import_songs(self, songs: List[Dict[str, Any]], dry_run: bool = False, 
                    limit: Optional[int] = None, start_from: int = 0) -> None:
        """Import all songs with optional limits."""
        
        if not self.test_connection():
            print("❌ Cannot connect to backend. Aborting import.")
            return
        
        # Apply start_from and limit
        if start_from > 0:
            songs = songs[start_from:]
            print(f"📍 Starting from song #{start_from + 1}")
        
        if limit:
            songs = songs[:limit]
            print(f"📊 Limiting import to {limit} songs")
        
        self.stats["total"] = len(songs)
        
        if dry_run:
            print(f"\n🔍 DRY RUN MODE - No songs will actually be imported")
        
        print(f"\n🚀 Starting import of {len(songs)} songs...")
        print("=" * 60)
        
        for i, song in enumerate(songs):
            try:
                self.import_song(song, start_from + i, dry_run)
                
                # Add delay between requests to be respectful to the server
                if not dry_run and i < len(songs) - 1:
                    time.sleep(DELAY_BETWEEN_REQUESTS)
                    
            except KeyboardInterrupt:
                print(f"\n⚠️  Import interrupted by user at song #{i + 1}")
                break
            except Exception as e:
                print(f"❌ Unexpected error processing song #{i + 1}: {e}")
                self.stats["failed"] += 1
                continue
        
        self.print_summary(dry_run)
    
    def print_summary(self, dry_run: bool = False) -> None:
        """Print import summary statistics."""
        print("\n" + "=" * 60)
        if dry_run:
            print("🔍 DRY RUN SUMMARY")
        else:
            print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"Total songs processed: {self.stats['total']}")
        print(f"✅ Successfully imported: {self.stats['success']}")
        print(f"⚠️  Skipped: {self.stats['skipped']}")
        print(f"❌ Failed: {self.stats['failed']}")
        
        if self.stats["total"] > 0:
            success_rate = (self.stats["success"] / self.stats["total"]) * 100
            print(f"📈 Success rate: {success_rate:.1f}%")


def main():
    """Main function to run the import script."""
    parser = argparse.ArgumentParser(
        description="Import La Cuerda songs to ChoirApp production backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "--token", 
        required=True,
        help="JWT token for authentication (required)"
    )
    
    parser.add_argument(
        "--dry-run", 
        action="store_true", 
        help="Show what would be imported without actually doing it"
    )
    
    parser.add_argument(
        "--limit", 
        type=int, 
        help="Import only N songs (useful for testing)"
    )
    
    parser.add_argument(
        "--start-from", 
        type=int, 
        default=0,
        help="Start importing from song number N (useful for resuming)"
    )
    
    args = parser.parse_args()
    
    print("🎵 ChoirApp Production Song Importer")
    print("=" * 60)
    print("⚠️  WARNING: This will import songs to PRODUCTION database!")
    print("=" * 60)
    
    if not args.dry_run:
        confirm = input("\n❓ Are you sure you want to proceed? (yes/no): ").lower().strip()
        if confirm not in ['yes', 'y']:
            print("❌ Import cancelled by user")
            return
    
    # Initialize importer
    importer = SongImporter(args.token, PRODUCTION_API_URL)
    
    # Load songs
    songs = importer.load_songs()
    
    # Import songs
    importer.import_songs(
        songs, 
        dry_run=args.dry_run, 
        limit=args.limit, 
        start_from=args.start_from
    )


if __name__ == "__main__":
    main()
