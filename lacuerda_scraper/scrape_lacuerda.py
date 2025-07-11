import requests
from bs4 import BeautifulSoup
import json
import os
import time

BASE_URL = "https://chords.lacuerda.net/mus_catolica/"
SONG_BASE = "https://chords.lacuerda.net"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ChoirAppBot/1.0)"}

OUTPUT_FILE = "lacuerda_songs.json"

def get_song_links():
    print("Fetching song index...")
    resp = requests.get(BASE_URL, headers=HEADERS)
    resp.raise_for_status()
    with open('index_debug.html', 'w', encoding='utf-8') as f:
        f.write(resp.text)
    soup = BeautifulSoup(resp.text, "html.parser")
    links = set()
    main_ul = soup.find('ul', id='b_main')
    if not main_ul:
        print("Could not find the main song list <ul id='b_main'>.")
        return []
    for a in main_ul.find_all('a', href=True):
        href = a['href'].strip()
        if href and not href.startswith('javascript:'):
            # Build full URL
            url = SONG_BASE + '/mus_catolica/' + href
            links.add(url)
    links = list(links)
    print(f"Found {len(links)} song links.")
    return links

def parse_song_page(url):
    print(f"Scraping: {url}")
    try:
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Title and artist extraction
        h1 = soup.find("h1")
        title = h1.text.strip() if h1 else "Unknown"
        # Remove trailing 'Música Católica' from title if present
        if title.lower().endswith("música católica"):
            title = title[:-(len("música católica"))].strip(" -:–")
        # Try to extract artist from <h2> if present
        h2 = soup.find("h2")
        if h2 and "de:" in h2.text.lower():
            artist = h2.text.split(":", 1)[-1].strip()
        else:
            artist = "Música Católica"
        # Chords/lyrics extraction
        pre = soup.find("pre")
        chords = pre.text.strip() if pre else ""
        chordpro = to_chordpro_format(chords)
        # Metadata (tags, source, etc.)
        tags = []
        for tag in soup.select("a[href^='/genero/']"):
            tags.append(tag.text.strip())
        if title and chordpro:
            print(f"  Success: {title}")
            return {
                "title": title,
                "artist": artist,
                "chordpro": chordpro,
                "tags": tags,
                "source_url": url
            }
        else:
            print(f"  Skipped: Missing title or chords")
            return None
    except Exception as e:
        print(f"  Error scraping {url}: {e}")
        return None

def main():
    links = get_song_links()
    print(f"Preparing to scrape {len(links)} songs...")
    unique_links = []
    seen = set()
    for url in links:
        if url not in seen:
            unique_links.append(url)
            seen.add(url)

    print(f"Scraping {len(unique_links)} unique songs for testing...")
    songs = []
    for i, url in enumerate(unique_links):
        song = parse_song_page(url)
        if song:
            songs.append(song)
        else:
            print(f"[SKIP] {url}")
        # Save after every song for maximum safety
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(songs, f, ensure_ascii=False, indent=2)
        print(f"[PROGRESS] Saved {len(songs)} songs at {i+1} of {len(unique_links)}...")
        time.sleep(1.5)  # polite delay to avoid rate limiting
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(songs)} songs to {OUTPUT_FILE}")

def to_chordpro_format(text):
    """
    Converts laCuerda two-line format to ChordPro inline format.
    Each pair of lines: chords, lyrics -> merged to [CHORD]lyric.
    Preserves blank lines and lines without chords.
    Adds {start_of_verse}/{end_of_verse} markers for blocks.
    """
    lines = text.splitlines()
    result = []
    i = 0
    while i < len(lines):
        # Skip empty lines
        if lines[i].strip() == "":
            result.append("")
            i += 1
            continue
        # If next line exists and is not blank, treat as chords+lyrics
        if i+1 < len(lines) and lines[i+1].strip() != "":
            chords_line = lines[i]
            lyric_line = lines[i+1]
            merged = merge_chords_lyrics(chords_line, lyric_line)
            # Start a new verse if previous line was blank or start of file
            if not result or result[-1] == "":
                result.append("{start_of_verse}")
            result.append(merged)
            # If next next line is blank or end, close verse
            if i+2 >= len(lines) or lines[i+2].strip() == "":
                result.append("{end_of_verse}")
            i += 2
        else:
            # No chord line, just lyrics or single line
            if not result or result[-1] == "":
                result.append("{start_of_verse}")
            result.append(lines[i])
            if i+1 >= len(lines) or lines[i+1].strip() == "":
                result.append("{end_of_verse}")
            i += 1
    return "\n".join(result)

def merge_chords_lyrics(chords_line, lyric_line):
    """
    Merges a chords line and a lyric line into ChordPro inline format.
    """
    import re
    # Find chord positions (non-space sequences)
    chord_spans = [(m.start(), m.group()) for m in re.finditer(r'\S+', chords_line)]
    lyric = lyric_line
    offset = 0
    for pos, chord in chord_spans:
        # Insert chord at the right position in the lyric
        insert_at = min(pos + offset, len(lyric))
        lyric = lyric[:insert_at] + f'[{chord}]' + lyric[insert_at:]
        offset += len(chord) + 2  # +2 for []
    return lyric

if __name__ == "__main__":
    main()

