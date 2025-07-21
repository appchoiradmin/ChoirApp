import pdfplumber
import json
import re
import os
from typing import List, Dict, Optional

# Configuration
PDF_FILE_PATH = r"c:\ChoirAppV2\CANCIONERO JATARI FINAL.pdf"
OUTPUT_FILE = "pdf_songs_full.json"
START_PAGE = 40  # Songs start from page 40

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from the PDF file starting from START_PAGE."""
    print(f"Extracting text from PDF: {pdf_path}")
    print(f"Starting from page {START_PAGE}...")
    
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    full_text = ""
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"PDF has {total_pages} pages total")
            
            pages_to_process = total_pages - START_PAGE + 1
            print(f"Will process {pages_to_process} pages (from page {START_PAGE} to {total_pages})")
            
            pages_processed = 0
            for page_num, page in enumerate(pdf.pages, 1):
                if page_num < START_PAGE:
                    continue
                    
                print(f"Processing page {page_num}/{total_pages}...")
                page_text = page.extract_text()
                if page_text:
                    full_text += f"\n--- PAGE {page_num} ---\n"
                    full_text += page_text + "\n"
                    pages_processed += 1
                    
                # Progress indicator every 10 pages
                if pages_processed % 10 == 0:
                    print(f"  ✓ Processed {pages_processed} pages so far...")
                    
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        raise
    
    print(f"✅ Extracted {len(full_text)} characters from {pages_processed} pages")
    return full_text

def identify_song_boundaries(text: str) -> List[str]:
    """
    Split the text into individual songs.
    Based on our successful test, we'll use page-based separation as primary strategy.
    """
    
    # Save raw text for debugging
    with open('pdf_debug_full.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Debug text saved to pdf_debug_full.txt")
    
    songs_raw = []
    
    # Primary strategy: Split by page boundaries (this worked well in our test)
    pages = text.split('--- PAGE')
    
    for page in pages:
        if not page.strip():
            continue
            
        # Clean up page content
        page_content = page.strip()
        
        # Remove page number line
        lines = page_content.split('\n')
        if lines and lines[0].strip().endswith('---'):
            lines = lines[1:]
        
        page_text = '\n'.join(lines).strip()
        
        # Check if this page has substantial content (likely a song)
        # Lowered threshold since some songs might be shorter
        if page_text and len(page_text) > 50:
            songs_raw.append(page_text)
    
    print(f"Strategy 1 - Found {len(songs_raw)} potential songs by page separation")
    
    # Secondary strategy: If we have pages with multiple songs, try to split them
    additional_songs = []
    for i, song in enumerate(songs_raw):
        # Look for multiple song titles in a single page
        lines = song.split('\n')
        potential_titles = []
        
        for j, line in enumerate(lines):
            line = line.strip()
            # Look for lines that could be song titles (short, meaningful, often in caps)
            if (len(line) > 3 and len(line) < 80 and 
                not has_chord_patterns(line) and
                not line.isdigit() and
                not line.startswith('---')):
                
                # Check if this could be a title by looking at surrounding context
                if j < len(lines) - 3:  # Make sure there's content after
                    next_lines = lines[j+1:j+4]
                    has_content_after = any(len(l.strip()) > 10 for l in next_lines)
                    if has_content_after:
                        potential_titles.append((j, line))
        
        # If we found multiple potential titles, try to split
        if len(potential_titles) > 1:
            print(f"  Found {len(potential_titles)} potential songs in page {i+1}")
            
            for k, (line_idx, title) in enumerate(potential_titles):
                # Get content from this title to the next title (or end)
                start_idx = line_idx
                end_idx = potential_titles[k+1][0] if k+1 < len(potential_titles) else len(lines)
                
                song_lines = lines[start_idx:end_idx]
                song_content = '\n'.join(song_lines).strip()
                
                if len(song_content) > 100:  # Minimum content threshold
                    additional_songs.append(song_content)
    
    if additional_songs:
        print(f"Strategy 2 - Found {len(additional_songs)} additional songs by multi-song page splitting")
        songs_raw.extend(additional_songs)
    
    print(f"Total songs found: {len(songs_raw)}")
    return songs_raw

def parse_song_content(raw_song: str, song_index: int) -> Optional[Dict]:
    """
    Parse individual song content to extract title, artist, and chordpro content.
    """
    
    lines = raw_song.strip().split('\n')
    if not lines:
        return None
    
    if song_index % 10 == 0:  # Progress indicator
        print(f"  Parsing song {song_index}...")
    
    # Try to identify the title (usually first meaningful line)
    title = None
    content_start_idx = 0
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Check if this looks like a title
        if not title:
            # Remove common prefixes/suffixes
            clean_line = re.sub(r'^\d+\.\s*', '', line)  # Remove numbering
            clean_line = re.sub(r'\s*-+\s*$', '', clean_line)  # Remove trailing dashes
            clean_line = re.sub(r'^PAGE\s+\d+\s*---\s*', '', clean_line)  # Remove page markers
            clean_line = re.sub(r'^\s*---.*---\s*$', '', clean_line)  # Remove page separators
            
            if len(clean_line) > 2 and len(clean_line) < 100:
                title = clean_line
                content_start_idx = i + 1
                break
    
    if not title:
        # Fallback: use first meaningful line as title
        for line in lines:
            if line.strip() and not line.strip().startswith('---'):
                title = line.strip()[:50]
                break
        
        if not title:
            title = f"Song {song_index}"
    
    # Extract the song content (lyrics and chords)
    content_lines = lines[content_start_idx:] if content_start_idx < len(lines) else lines[1:]
    song_content = '\n'.join(content_lines).strip()
    
    # Convert to ChordPro format (same logic as our successful test)
    chordpro_content = to_chordpro_format(song_content)
    
    # Skip songs that are too short (likely not actual songs)
    if len(chordpro_content.strip()) < 50:
        return None
    
    return {
        "title": title,
        "artist": "Cancionero Jatari",  # Default artist from PDF source
        "chordpro": chordpro_content,
        "tags": [],
        "source": "PDF: CANCIONERO JATARI FINAL.pdf"
    }

def to_chordpro_format(text: str) -> str:
    """
    Converts song text to ChordPro inline format.
    This is the same logic that worked successfully in our test.
    """
    
    if not text.strip():
        return ""
    
    lines = text.split('\n')
    result_lines = []
    in_verse = False
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines but preserve them for spacing
        if not line:
            if in_verse:
                result_lines.append("{end_of_verse}")
                in_verse = False
            result_lines.append("")
            i += 1
            continue
        
        # Check if this line contains chord patterns
        if has_chord_patterns(line):
            # This is likely a chord line
            if not in_verse:
                result_lines.append("{start_of_verse}")
                in_verse = True
            
            # Check if next line is lyrics (merge chord and lyric lines)
            if i + 1 < len(lines) and lines[i + 1].strip() and not has_chord_patterns(lines[i + 1].strip()):
                # Merge chord line with next lyric line
                lyric_line = lines[i + 1].strip()
                merged_line = merge_chords_lyrics(line, lyric_line)
                result_lines.append(merged_line)
                i += 2  # Skip both lines
            else:
                # Just chord line
                chord_line = convert_chord_line(line)
                result_lines.append(chord_line)
                i += 1
        else:
            # This is likely a lyric line
            if not in_verse:
                result_lines.append("{start_of_verse}")
                in_verse = True
            
            result_lines.append(line)
            i += 1
    
    # Close final verse if needed
    if in_verse:
        result_lines.append("{end_of_verse}")
    
    return '\n'.join(result_lines)

def has_chord_patterns(line: str) -> bool:
    """
    Check if a line contains chord-like patterns.
    Same logic as our successful test.
    """
    
    # Common Spanish chord patterns
    chord_patterns = [
        r'\b[A-G][#b]?m?\b',  # Basic chords like Am, F#, Bb
        r'\b(DO|RE|MI|FA|SOL|LA|SI)[#b]?m?\b',  # Spanish notation
        r'\b(Dom|Rem|Mim|Fam|Solm|Lam|Sim)\b',  # Spanish minor chords
        r'\b[A-G][#b]?(maj|min|sus|dim|aug)?\d?\b',  # Extended chords
    ]
    
    chord_count = 0
    for pattern in chord_patterns:
        matches = re.findall(pattern, line, re.IGNORECASE)
        chord_count += len(matches)
    
    # Consider it a chord line if it has 2+ chord patterns
    return chord_count >= 2

def merge_chords_lyrics(chords_line: str, lyric_line: str) -> str:
    """
    Merges a chords line and a lyric line into ChordPro inline format.
    Same logic as our successful test.
    """
    
    # Simple approach: find chord positions and insert them into lyrics
    result = lyric_line
    
    # Find all chord patterns in the chord line
    chord_patterns = [
        r'\b([A-G][#b]?m?)\b',
        r'\b(DO|RE|MI|FA|SOL|LA|SI)([#b]?m?)\b',
    ]
    
    chords_found = []
    for pattern in chord_patterns:
        for match in re.finditer(pattern, chords_line, re.IGNORECASE):
            chord = match.group(0)
            position = match.start()
            chords_found.append((position, chord))
    
    # Sort by position
    chords_found.sort(key=lambda x: x[0])
    
    # Insert chords into lyrics at approximate positions
    if chords_found and len(lyric_line) > 0:
        # Simple insertion at proportional positions
        for i, (chord_pos, chord) in enumerate(reversed(chords_found)):
            # Calculate proportional position in lyric line
            lyric_pos = min(int((chord_pos / len(chords_line)) * len(lyric_line)), len(result))
            result = result[:lyric_pos] + f"[{chord}]" + result[lyric_pos:]
    
    return result

def convert_chord_line(line: str) -> str:
    """
    Convert a line with chords to ChordPro inline format.
    """
    
    # Wrap detected chords in brackets
    chord_patterns = [
        (r'\b([A-G][#b]?m?)\b', r'[\1]'),
        (r'\b(DO|RE|MI|FA|SOL|LA|SI)([#b]?m?)\b', r'[\1\2]'),
    ]
    
    result = line
    for pattern, replacement in chord_patterns:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result

def main():
    """Main scraping function for full PDF extraction."""
    
    print("=== PDF Song Scraper - FULL EXTRACTION ===")
    print(f"Processing: {PDF_FILE_PATH}")
    print(f"Extracting ALL songs starting from page {START_PAGE}")
    
    try:
        # Extract text from entire PDF
        pdf_text = extract_text_from_pdf(PDF_FILE_PATH)
        
        # Identify individual songs
        raw_songs = identify_song_boundaries(pdf_text)
        
        print(f"\n=== PROCESSING SONGS ===")
        print(f"Processing {len(raw_songs)} potential songs...")
        
        # Parse each song
        songs = []
        failed_count = 0
        
        for i, raw_song in enumerate(raw_songs, 1):
            parsed_song = parse_song_content(raw_song, i)
            if parsed_song:
                songs.append(parsed_song)
                if i % 10 == 0:  # Progress indicator
                    print(f"  ✓ Processed {i}/{len(raw_songs)} songs, {len(songs)} successful")
            else:
                failed_count += 1
        
        # Save results
        print(f"\n=== SAVING RESULTS ===")
        print(f"Saving {len(songs)} songs to {OUTPUT_FILE}...")
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(songs, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎉 EXTRACTION COMPLETE! 🎉")
        print(f"✅ Successfully extracted: {len(songs)} songs")
        print(f"❌ Failed to parse: {failed_count} items")
        print(f"📁 Output saved to: {OUTPUT_FILE}")
        print(f"🔍 Debug text saved to: pdf_debug_full.txt")
        
        # Show statistics
        if songs:
            total_chars = sum(len(song['chordpro']) for song in songs)
            avg_chars = total_chars // len(songs)
            
            print(f"\n📊 STATISTICS:")
            print(f"   Total songs: {len(songs)}")
            print(f"   Total ChordPro content: {total_chars:,} characters")
            print(f"   Average song length: {avg_chars} characters")
            
            # Show sample titles
            print(f"\n🎵 SAMPLE SONG TITLES:")
            for i, song in enumerate(songs[:10]):
                print(f"   {i+1}. {song['title']}")
            if len(songs) > 10:
                print(f"   ... and {len(songs) - 10} more songs")
        
        print(f"\n🚀 Ready to import into ChoirApp backend!")
        
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
