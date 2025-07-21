#!/usr/bin/env python3
"""
Production Import Script for ChoirApp - PDF Songs (Cancionero Jatari)
======================================================================

This script imports scraped songs from pdf_songs_full.json into the production ChoirApp backend.

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
SONGS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'pdf_songs_full.json')

# Production JWT Token will be provided via command line argument

# Request configuration
REQUEST_TIMEOUT = 30  # seconds
DELAY_BETWEEN_REQUESTS = 1  # seconds to avoid overwhelming the server

class PDFSongImporter:
    """Handles the import of PDF songs to the production backend."""
    
    def __init__(self, jwt_token: str, api_url: str):
        self.jwt_token = jwt_token
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json",
            "User-Agent": "ChoirApp-PDF-Importer/1.0"
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
        """Convert PDF scraped song format to backend API format."""
        # Extract original key from chordpro content if possible
        original_key = self.extract_key_from_chordpro(song.get("chordpro", ""))
        
        return {
            "title": song.get("title", "").strip(),
            "artist": song.get("artist", "").strip(),
            "originalKey": original_key,
            "content": song.get("chordpro", "").strip(),
            "visibility": 1,  # 1 = PublicAll (so all users can see these songs)
            "sourceUrl": song.get("source", "").strip()  # PDF source info
        }
    
    def extract_key_from_chordpro(self, chordpro: str) -> str:
        """Try to extract the musical key from ChordPro content."""
        if not chordpro:
            return ""
        
        # Look for common key patterns in the first few lines
        lines = chordpro.split('\n')[:10]  # Check first 10 lines
        
        # Common key patterns (both Spanish and international notation)
        key_patterns = [
            # Spanish notation
            r'\b(DO|RE|MI|FA|SOL|LA|SI)[#b]?m?\b',
            # International notation  
            r'\b[A-G][#b]?m?\b'
        ]
        
        import re
        for line in lines:
            for pattern in key_patterns:
                matches = re.findall(pattern, line, re.IGNORECASE)
                if matches:
                    # Return the first chord found (likely the key)
                    return matches[0]
        
        return ""
    
    def validate_song(self, song: Dict[str, Any]) -> tuple[bool, str]:
        """Validate that a song has required fields."""
        if not song.get("title", "").strip():
            return False, "Missing title"
        
        if not song.get("artist", "").strip():
            return False, "Missing artist"
        
        if not song.get("chordpro", "").strip():
            return False, "Missing content"
        
        # Check for reasonable content length
        content = song.get("chordpro", "").strip()
        if len(content) < 20:
            return False, "Content too short"
        
        return True, "Valid"
    
    def import_song(self, song: Dict[str, Any], dry_run: bool = False) -> tuple[bool, str]:
        """Import a single song to the backend."""
        
        # Validate song first
        is_valid, validation_msg = self.validate_song(song)
        if not is_valid:
            return False, f"Validation failed: {validation_msg}"
        
        # Convert to API format
        payload = self.convert_song_format(song)
        
        if dry_run:
            return True, f"DRY RUN: Would import '{payload['title']}' by {payload['artist']}"
        
        try:
            response = requests.post(
                CREATE_SONG_ENDPOINT,
                headers=self.headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 201:
                return True, f"Successfully imported '{payload['title']}'"
            elif response.status_code == 409:
                return False, f"Song already exists: '{payload['title']}'"
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json()
                    if 'message' in error_detail:
                        error_msg += f": {error_detail['message']}"
                except:
                    error_msg += f": {response.text[:200]}"
                
                return False, error_msg
                
        except requests.exceptions.Timeout:
            return False, "Request timeout"
        except requests.exceptions.ConnectionError:
            return False, "Connection error"
        except requests.exceptions.RequestException as e:
            return False, f"Request error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
    
    def import_songs(self, songs: List[Dict[str, Any]], dry_run: bool = False, 
                    limit: Optional[int] = None, start_from: int = 0) -> None:
        """Import multiple songs with progress tracking."""
        
        # Apply start_from and limit
        if start_from > 0:
            songs = songs[start_from:]
            print(f"📍 Starting from song #{start_from + 1}")
        
        if limit:
            songs = songs[:limit]
            print(f"🔢 Limiting to {limit} songs")
        
        total_songs = len(songs)
        self.stats["total"] = total_songs
        
        print(f"\n🚀 {'DRY RUN: ' if dry_run else ''}Starting import of {total_songs} songs...")
        print(f"📡 Target: {PRODUCTION_API_URL}")
        print("-" * 80)
        
        for i, song in enumerate(songs, 1):
            song_title = song.get("title", "Unknown")[:50]
            
            print(f"[{i:3d}/{total_songs}] Processing: {song_title}...")
            
            success, message = self.import_song(song, dry_run)
            
            if success:
                self.stats["success"] += 1
                print(f"    ✅ {message}")
            else:
                self.stats["failed"] += 1
                print(f"    ❌ {message}")
            
            # Add delay between requests to avoid overwhelming the server
            if not dry_run and i < total_songs:
                time.sleep(DELAY_BETWEEN_REQUESTS)
            
            # Progress update every 10 songs
            if i % 10 == 0:
                success_rate = (self.stats["success"] / i) * 100
                print(f"    📊 Progress: {i}/{total_songs} ({success_rate:.1f}% success rate)")
        
        self.print_final_stats(dry_run)
    
    def print_final_stats(self, dry_run: bool = False) -> None:
        """Print final import statistics."""
        print("\n" + "=" * 80)
        print(f"🏁 {'DRY RUN ' if dry_run else ''}IMPORT COMPLETED")
        print("=" * 80)
        print(f"📊 Total songs processed: {self.stats['total']}")
        print(f"✅ Successfully imported: {self.stats['success']}")
        print(f"❌ Failed to import: {self.stats['failed']}")
        print(f"⏭️  Skipped: {self.stats['skipped']}")
        
        if self.stats["total"] > 0:
            success_rate = (self.stats["success"] / self.stats["total"]) * 100
            print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.stats["failed"] > 0:
            print(f"\n⚠️  {self.stats['failed']} songs failed to import.")
            if not dry_run:
                print("   Check the error messages above for details.")
                print("   You can resume from a specific song using --start-from N")

def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Import PDF songs to ChoirApp production backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python import_to_production.py --token eyJ0eXAi... --dry-run
  python import_to_production.py --token eyJ0eXAi... --limit 10
  python import_to_production.py --token eyJ0eXAi... --start-from 50
        """
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
        help="Start importing from song number N (0-based, useful for resuming)"
    )
    
    return parser.parse_args()

def validate_token(token: str) -> bool:
    """Basic JWT token validation."""
    if not token:
        return False
    
    # JWT tokens have 3 parts separated by dots
    parts = token.split('.')
    if len(parts) != 3:
        return False
    
    # Each part should be base64-encoded (basic check)
    for part in parts:
        if not part or not part.replace('-', '').replace('_', '').isalnum():
            return False
    
    return True

def main():
    """Main function to run the import script."""
    print("🎵 ChoirApp PDF Songs Production Import")
    print("=" * 50)
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Validate JWT token
    if not validate_token(args.token):
        print("❌ Error: Invalid JWT token format")
        print("   Please provide a valid JWT token using --token")
        sys.exit(1)
    
    # Validate file exists
    if not os.path.exists(SONGS_FILE_PATH):
        print(f"❌ Error: Songs file not found at {SONGS_FILE_PATH}")
        print("   Make sure you have run the PDF scraper first")
        sys.exit(1)
    
    # Show configuration
    print(f"📁 Songs file: {SONGS_FILE_PATH}")
    print(f"🌐 Production API: {PRODUCTION_API_URL}")
    print(f"🔑 Token: {args.token[:20]}...{args.token[-10:]}")
    
    if args.dry_run:
        print("🧪 DRY RUN MODE: No actual imports will be performed")
    
    if args.limit:
        print(f"🔢 Limit: {args.limit} songs")
    
    if args.start_from > 0:
        print(f"📍 Start from: song #{args.start_from + 1}")
    
    # Confirm before proceeding (unless dry run)
    if not args.dry_run:
        print("\n⚠️  WARNING: This will import songs to PRODUCTION!")
        confirm = input("Are you sure you want to continue? (yes/no): ").lower().strip()
        if confirm not in ['yes', 'y']:
            print("❌ Import cancelled by user")
            sys.exit(0)
    
    print("\n" + "-" * 50)
    
    try:
        # Create importer and load songs
        importer = PDFSongImporter(args.token, PRODUCTION_API_URL)
        songs = importer.load_songs()
        
        # Start import
        importer.import_songs(
            songs=songs,
            dry_run=args.dry_run,
            limit=args.limit,
            start_from=args.start_from
        )
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Import interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
