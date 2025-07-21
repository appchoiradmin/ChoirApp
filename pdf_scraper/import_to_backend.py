import requests
import json
import os

# --- Configuration ---
# Please ensure the backend is running and this URL is correct.
API_BASE_URL = "http://localhost:5014/api"
CREATE_SONG_ENDPOINT = f"{API_BASE_URL}/songs"
SONGS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'pdf_songs_full.json')

# --- Authentication Token ---
# IMPORTANT: You must get a JWT token by logging into the web application.
# 1. Open your browser's developer tools (F12).
# 2. Go to the 'Network' tab.
# 3. Log in to the ChoirApp application.
# 4. Find a request to the API (e.g., 'me') and look at the 'Request Headers'.
# 5. Copy the entire 'Authorization' header value, which looks like 'Bearer ey...',
#    and paste ONLY the token part (the 'ey...' part) below.
JWT_TOKEN = ""

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

    print(f"Starting import of {len(songs)} songs from PDF...")
    success_count = 0
    failure_count = 0
    
    for i, song in enumerate(songs):
        # Prepare the song data for the backend API (matching your existing structure)
        payload = {
            "title": song.get("title"),
            "artist": song.get("artist"),
            "originalKey": "",  # PDF songs don't have original key info
            "content": song.get("chordpro", ""),  # Use chordpro content
            "visibility": 1  # 0 = Private, 1 = PublicAll, 2 = PublicChoirs - Set to PublicAll so songs are visible
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
    print("=== PDF Songs Backend Import ===")
    
    if not JWT_TOKEN or JWT_TOKEN == "PASTE_YOUR_JWT_TOKEN_HERE":
        print("Error: Authentication token not provided.")
        print("Please edit the script and paste your JWT token into the 'JWT_TOKEN' variable.")
        print("\nTo get your JWT token:")
        print("1. Open your browser's developer tools (F12).")
        print("2. Go to the 'Network' tab.")
        print("3. Log in to the ChoirApp application.")
        print("4. Find a request to the API and look at the 'Request Headers'.")
        print("5. Copy the token part from the 'Authorization: Bearer ey...' header.")
        return

    import_songs(JWT_TOKEN)

if __name__ == "__main__":
    main()
