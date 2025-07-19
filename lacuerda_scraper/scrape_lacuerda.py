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
        # Chords/lyrics extraction - find the pre tag with the most content (actual song)
        pres = soup.find_all("pre")
        chords = ""
        if pres:
            # Find the pre tag with the most content (likely the song content)
            longest_pre = max(pres, key=lambda p: len(p.text.strip()))
            chords = longest_pre.text.strip()
            print(f"  Found {len(pres)} pre tags, using one with {len(chords)} characters")
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
    Handles section labels like INTRO:, VERSE:, CHORUS: properly.
    """
    lines = text.splitlines()
    result = []
    i = 0
    
    def is_section_label(line):
        """Check if a line is a section label like INTRO:, VERSE:, CHORUS:, etc."""
        line = line.strip().upper()
        section_keywords = ['INTRO:', 'VERSE:', 'CHORUS:', 'BRIDGE:', 'OUTRO:', 'CODA:', 'ESTRIBILLO:', 'VERSO:']
        return any(line.startswith(keyword) or line == keyword.rstrip(':') for keyword in section_keywords)
    
    while i < len(lines):
        current_line = lines[i].strip()
        
        # Skip empty lines
        if current_line == "":
            result.append("")
            i += 1
            continue
        
        # Check if current line is a section label
        if is_section_label(current_line):
            # Add section label as-is (not as a chord)
            if not result or result[-1] == "":
                result.append("{start_of_verse}")
            result.append(current_line)
            i += 1
            continue
        
        # If next line exists and is not blank, and current line is not a section label
        if i+1 < len(lines) and lines[i+1].strip() != "" and not is_section_label(lines[i+1]):
            chords_line = lines[i]
            lyric_line = lines[i+1]
            
            # Check if the chords line looks like actual chords (contains chord-like patterns)
            if has_chord_patterns(chords_line):
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
                # Treat as single line (not chord/lyric pair)
                if not result or result[-1] == "":
                    result.append("{start_of_verse}")
                result.append(current_line)
                if i+1 >= len(lines) or lines[i+1].strip() == "":
                    result.append("{end_of_verse}")
                i += 1
        else:
            # No chord line, just lyrics or single line
            if not result or result[-1] == "":
                result.append("{start_of_verse}")
            result.append(current_line)
            if i+1 >= len(lines) or lines[i+1].strip() == "":
                result.append("{end_of_verse}")
            i += 1
    return "\n".join(result)

def has_chord_patterns(line):
    """Check if a line contains chord-like patterns (Spanish chord names)"""
    import re
    # Common Spanish chord patterns
    chord_patterns = [
        r'\b(DO|RE|MI|FA|SOL|LA|SI)\b',  # Basic Spanish chords
        r'\b[A-G][#b]?m?\b',  # English chord notation (C, Dm, F#, etc.)
        r'\b(LAm|REm|MIm|FAm|SOLm|SIm)\b',  # Minor Spanish chords
        r'\b(DO#|RE#|FA#|SOL#|LA#)\b',  # Sharp chords
        r'\b[A-G][#b]?(sus[24]?|maj[79]?|m[679]?|dim|aug|add[0-9])\b',  # Complex chords
        r'/[A-G][#b]?\b'  # Slash chords like LA/DO#
    ]
    
    for pattern in chord_patterns:
        if re.search(pattern, line, re.IGNORECASE):
            return True
    return False

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

