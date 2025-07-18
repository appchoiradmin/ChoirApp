import requests
import json
import os

# --- Configuration ---
# Please ensure the backend is running and this URL is correct.
API_BASE_URL = "http://localhost:5283/api"
CREATE_SONG_ENDPOINT = f"{API_BASE_URL}/songs"
SONGS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'lacuerda_songs.json')

# --- Authentication Token ---
# IMPORTANT: You must get a JWT token by logging into the web application.
# 1. Open your browser's developer tools (F12).
# 2. Go to the 'Network' tab.
# 3. Log in to the ChoirApp application.
# 4. Find a request to the API (e.g., 'me') and look at the 'Request Headers'.
# 5. Copy the entire 'Authorization' header value, which looks like 'Bearer ey...',
#    and paste ONLY the token part (the 'ey...' part) below.
JWT_TOKEN = "PASTE_YOUR_JWT_TOKEN_HERE"

def import_songs(token):
    """Reads songs from the JSON file and imports them via the API."""
    print(f"Reading songs from {SONGS_FILE_PATH}...")
    try:
        with open(SONGS_FILE_PATH, 'r', encoding='utf-8') as f:
            songs = json.load(f)
    except FileNotFoundError:
        print(f"Error: Songs file not found at {SONGS_FILE_PATH}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {SONGS_FILE_PATH}")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print(f"Starting import of {len(songs)} songs...")
    success_count = 0
    failure_count = 0
    for i, song in enumerate(songs):
        payload = {
            "title": song.get("nombre"),
            "artist": song.get("artista"),
            "originalKey": song.get("tono", ""),
            "content": song.get("acordes", ""),
            "visibility": 0  # 0 = Private, 1 = Public
        }

        if not payload["title"] or not payload["artist"]:
            print(f"Skipping song {i+1} due to missing title or artist.")
            failure_count += 1
            continue

        try:
            response = requests.post(CREATE_SONG_ENDPOINT, headers=headers, json=payload)
            if response.status_code == 201:
                print(f"({i+1}/{len(songs)}) Successfully imported '{payload['title']}' by {payload['artist']}'.")
                success_count += 1
            else:
                print(f"({i+1}/{len(songs)}) Failed to import '{payload['title']}'. Status: {response.status_code}, Response: {response.text}")
                failure_count += 1
        except requests.exceptions.RequestException as e:
            print(f"({i+1}/{len(songs)}) An error occurred while importing '{payload['title']}': {e}")
            failure_count += 1

    print("\nImport process finished.")
    print(f"Successfully imported: {success_count}")
    print(f"Failed to import: {failure_count}")

def main():
    """Main function to run the import script."""
    if not JWT_TOKEN or JWT_TOKEN == "PASTE_YOUR_JWT_TOKEN_HERE":
        print("Error: Authentication token not provided.")
        print("Please edit the script and paste your JWT token into the 'JWT_TOKEN' variable.")
        return

    import_songs(JWT_TOKEN)

if __name__ == "__main__":
    main()

import json
import getpass
import sys
import time

API_BASE = "http://localhost:5014"
ENDPOINT = "/api/songs"
INPUT_FILE = "lacuerda_songs.json"


def main():
    # Get authentication token
    print("Please enter your authentication token:")
    token = getpass.getpass("Bearer token: ")
    if not token:
        print("No token provided. Exiting.")
        sys.exit(1)
        
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        songs = json.load(f)

    success_count = 0
    error_count = 0
    
    for i, song in enumerate(songs):
        # Map the song data to the new API format
        payload = {
            "title": song.get("title", "").strip(),
            "artist": song.get("artist", "").strip(),
            "content": song.get("chordpro", "").strip(),
            "visibility": 1  # 0=Private, 1=PublicAll, 2=PublicChoirs
        }
        print(f"[{i+1}/{len(songs)}] Importing: {payload['title']} ...", end=" ")
        try:
            resp = requests.post(
                API_BASE + ENDPOINT,
                headers=headers,
                json=payload,
                timeout=10
            )
            if resp.status_code == 201:
                song_id = resp.json().get("songId")
                print("Success ✅")
                success_count += 1
                
                # Add tags if any
                tags = song.get("tags", [])
                if "Música Católica" in song.get("artist", "") and "música católica" not in tags:
                    tags.append("música católica")
                
                for tag in tags:
                    if tag.strip():
                        tag_payload = {
                            "tagName": tag.strip().lower()
                        }
                        
                        tag_resp = requests.post(
                            f"{API_BASE}{ENDPOINT}/{song_id}/tags",
                            headers=headers,
                            json=tag_payload,
                            timeout=10
                        )
                        
                        if tag_resp.status_code in [200, 201, 204]:
                            print(f"  - Added tag: {tag} ✅")
                        else:
                            print(f"  - Failed to add tag '{tag}': HTTP {tag_resp.status_code}")
                
            elif resp.status_code == 409:
                print("Duplicate (409), skipping.")
                error_count += 1
            elif resp.status_code == 400:
                print(f"Bad Request (400): {resp.text}")
                error_count += 1
            elif resp.status_code == 401:
                print("Unauthorized (401): Invalid or expired token.")
                sys.exit(1)
            else:
                print(f"Failed: HTTP {resp.status_code} - {resp.text}")
                error_count += 1
                
            # Add a small delay to avoid overwhelming the server
            time.sleep(0.1)
        except Exception as e:
            print(f"Error: {e}")
            error_count += 1
    
    print(f"\nImport completed!")
    print(f"Successfully imported: {success_count} songs")
    print(f"Failed to import: {error_count} songs")

if __name__ == "__main__":
    main()
