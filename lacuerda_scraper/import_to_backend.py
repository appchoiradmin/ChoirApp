import requests
import json
import getpass

API_BASE = "http://localhost:5014"
ENDPOINT = "/api/master-songs"
INPUT_FILE = "lacuerda_songs.json"


def main():
    # Use provided Bearer token directly for automation
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI2NTNlOGU2NS04ODhhLTQ1NWYtYTY3ZS0xM2I0ZTM1Y2VkMDEiLCJlbWFpbCI6ImFwcGNob2lyQGdtYWlsLmNvbSIsInJvbGUiOiJDaG9pckFkbWluIiwibmJmIjoxNzUyMjU0MDkwLCJleHAiOjE3NTI4NTg4OTAsImlhdCI6MTc1MjI1NDA5MCwiaXNzIjoiQ2hvaXJBcHBEZXYiLCJhdWQiOiJDaG9pckFwcFVzZXJzIn0.iW394kS__fKLkeefjov2qQcznZG4R1H3RIt_mxBd5bY"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        songs = json.load(f)

    for i, song in enumerate(songs):
        payload = {
            "title": song.get("title", "").strip(),
            "artist": song.get("artist", "").strip(),
            "lyricsChordPro": song.get("chordpro", "").strip(),
            "tags": song.get("tags", [])
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
                print("Success ✅")
            elif resp.status_code == 409:
                print("Duplicate (409), skipping.")
            elif resp.status_code == 400:
                print(f"Bad Request (400): {resp.text}")
            elif resp.status_code == 401:
                print("Unauthorized (401): Invalid or expired token.")
                break
            else:
                print(f"Failed: HTTP {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
