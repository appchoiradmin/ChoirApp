import requests
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
