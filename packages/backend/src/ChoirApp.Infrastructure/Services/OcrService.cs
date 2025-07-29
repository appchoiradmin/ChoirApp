using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using FluentResults;
using ChoirApp.Application.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Cloud.Vision.V1;

namespace ChoirApp.Infrastructure.Services;

public class OcrService : IOcrService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<OcrService> _logger;
    private readonly ImageAnnotatorClient? _visionClient;
    private readonly bool _useMockImplementation;

    public OcrService(IConfiguration configuration, ILogger<OcrService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        try
        {
            // Initialize Google Vision client
            // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
            _visionClient = ImageAnnotatorClient.Create();
            _useMockImplementation = false;
            _logger.LogInformation("Google Vision API client initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to initialize Google Vision API client. Using mock implementation for local development. Make sure GOOGLE_APPLICATION_CREDENTIALS is set for production.");
            _visionClient = null;
            _useMockImplementation = true;
        }
    }

    public async Task<Result<string>> ParseImageToChordProAsync(Stream imageStream, string fileName)
    {
        if (_useMockImplementation)
        {
            _logger.LogInformation("Using mock OCR implementation for file: {fileName}", fileName);
            return await GetMockChordProContentAsync(fileName);
        }

        if (_visionClient == null)
        {
            return Result.Fail("Google Vision API client not initialized. Please configure Google Cloud credentials.");
        }

        try
        {
            // First extract text using Google Vision API
            var extractResult = await ExtractTextFromImageAsync(imageStream, fileName);
            if (extractResult.IsFailed)
            {
                return extractResult;
            }

            // Check if the extracted text is already in ChordPro format (from mock implementation)
            var extractedText = extractResult.Value;
            if (extractedText.Contains("{title:") || extractedText.Contains("{artist:"))
            {
                // This is already ChordPro content from mock implementation
                _logger.LogInformation("Using mock ChordPro content directly for file: {fileName}", fileName);
                return Result.Ok(extractedText);
            }

            // Then parse the extracted text to ChordPro format
            var chordProContent = ParseTextToChordPro(extractedText);
            return Result.Ok(chordProContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing image to ChordPro format");
            return Result.Fail($"Failed to parse image: {ex.Message}");
        }
    }

    public async Task<Result<string>> ExtractTextFromImageAsync(Stream imageStream, string fileName)
    {
        if (_visionClient == null)
        {
            return Result.Fail("Google Vision API client not initialized. Please configure Google Cloud credentials.");
        }

        try
        {
            // Convert stream to byte array for Google Vision API
            imageStream.Position = 0;
            var imageBytes = new byte[imageStream.Length];
            await imageStream.ReadExactlyAsync(imageBytes, 0, imageBytes.Length);

            // Create Google Vision API image object
            var image = Image.FromBytes(imageBytes);

            // Perform text detection using Google Vision API
            var response = await _visionClient.DetectTextAsync(image);

            if (response == null || response.Count == 0)
            {
                return Result.Fail("No text could be extracted from the image");
            }

            // The first annotation contains the full text
            var extractedText = response[0].Description ?? "";
            
            _logger.LogInformation("Successfully extracted {CharCount} characters from image {FileName} using Google Vision API", 
                extractedText.Length, fileName);
            
            return Result.Ok(extractedText);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting text from image {FileName} using Google Vision API", fileName);
            
            // Check if this is a gRPC connection error, if so, fall back to mock implementation
            if (ex.Message.Contains("gRPC call") || ex.Message.Contains("HTTP/2 connection") || ex.GetType().Name.Contains("RpcException"))
            {
                _logger.LogWarning("Google Vision API connection failed, falling back to mock implementation for file: {fileName}", fileName);
                var mockResult = await GetMockChordProContentAsync(fileName);
                if (mockResult.IsSuccess)
                {
                    // Return the mock content as "extracted text" - it's already in ChordPro format
                    return Result.Ok(mockResult.Value);
                }
            }
            
            return Result.Fail($"Failed to extract text: {ex.Message}");
        }
    }

    private string ParseTextToChordPro(string extractedText)
    {
        if (string.IsNullOrWhiteSpace(extractedText))
        {
            return "";
        }

        var lines = extractedText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToArray();

        var result = new StringBuilder();
        var title = "";
        var artist = "";
        var inVerse = false;
        var inChorus = false;

        // Try to detect title and artist from first few lines
        if (lines.Length > 0)
        {
            title = lines[0];
            if (lines.Length > 1 && !IsChordLine(lines[1]) && !IsLyricsLine(lines[1]))
            {
                artist = lines[1];
            }
        }

        // Add ChordPro metadata
        if (!string.IsNullOrWhiteSpace(title))
        {
            result.AppendLine($"{{title: {title}}}");
        }
        if (!string.IsNullOrWhiteSpace(artist))
        {
            result.AppendLine($"{{artist: {artist}}}");
        }
        result.AppendLine();

        // Process lines starting after title/artist
        var startIndex = string.IsNullOrWhiteSpace(artist) ? 1 : 2;
        
        for (int i = startIndex; i < lines.Length; i++)
        {
            var line = lines[i];
            
            // Skip title/artist lines if they appear again
            if (line.Equals(title, StringComparison.OrdinalIgnoreCase) || 
                line.Equals(artist, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // Detect section headers
            if (IsVerseHeader(line))
            {
                if (inChorus) result.AppendLine("{end_of_chorus}");
                result.AppendLine("{start_of_verse}");
                inVerse = true;
                inChorus = false;
                continue;
            }
            
            if (IsChorusHeader(line))
            {
                if (inVerse) result.AppendLine("{end_of_verse}");
                result.AppendLine("{start_of_chorus}");
                inChorus = true;
                inVerse = false;
                continue;
            }

            // Process chord and lyrics lines
            if (IsChordLine(line))
            {
                // Look ahead for lyrics line
                if (i + 1 < lines.Length && IsLyricsLine(lines[i + 1]))
                {
                    var chordLine = line;
                    var lyricsLine = lines[i + 1];
                    var combinedLine = CombineChordsAndLyrics(chordLine, lyricsLine);
                    result.AppendLine(combinedLine);
                    i++; // Skip the lyrics line as we've processed it
                }
                else
                {
                    // Chord line without lyrics
                    result.AppendLine(FormatChordOnlyLine(line));
                }
            }
            else if (IsLyricsLine(line))
            {
                // Lyrics without chords above
                result.AppendLine(line);
            }
            else
            {
                // Other content (could be section markers, etc.)
                result.AppendLine(line);
            }
        }

        // Close any open sections
        if (inVerse) result.AppendLine("{end_of_verse}");
        if (inChorus) result.AppendLine("{end_of_chorus}");

        return result.ToString().Trim();
    }

    private bool IsChordLine(string line)
    {
        // Common chord patterns
        var chordPattern = @"\b[A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*(?:/[A-G][#b]?)?\b";
        var matches = Regex.Matches(line, chordPattern, RegexOptions.IgnoreCase);
        
        // If more than 30% of the line consists of chord-like patterns, consider it a chord line
        var chordLength = matches.Cast<Match>().Sum(m => m.Length);
        return matches.Count >= 2 && (double)chordLength / line.Length > 0.3;
    }

    private bool IsLyricsLine(string line)
    {
        // Lyrics typically have more words and fewer chord patterns
        var words = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Length >= 3 && !IsChordLine(line);
    }

    private bool IsVerseHeader(string line)
    {
        var versePatterns = new[] { "verse", "v1", "v2", "v3", "v4", "stanza" };
        return versePatterns.Any(pattern => line.ToLower().Contains(pattern));
    }

    private bool IsChorusHeader(string line)
    {
        var chorusPatterns = new[] { "chorus", "refrain", "hook" };
        return chorusPatterns.Any(pattern => line.ToLower().Contains(pattern));
    }

    private string CombineChordsAndLyrics(string chordLine, string lyricsLine)
    {
        // Simple algorithm to align chords with lyrics
        var result = new StringBuilder();
        var chordPositions = new List<(int position, string chord)>();
        
        // Extract chord positions
        var chordPattern = @"\b[A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*(?:/[A-G][#b]?)?\b";
        var matches = Regex.Matches(chordLine, chordPattern);
        
        foreach (Match match in matches)
        {
            chordPositions.Add((match.Index, match.Value));
        }

        // Insert chords into lyrics at appropriate positions
        var currentPos = 0;
        foreach (var (position, chord) in chordPositions.OrderBy(x => x.position))
        {
            // Add lyrics up to chord position
            var lyricsPart = "";
            if (position < lyricsLine.Length)
            {
                var endPos = Math.Min(lyricsLine.Length, position);
                if (endPos > currentPos)
                {
                    lyricsPart = lyricsLine.Substring(currentPos, endPos - currentPos);
                }
            }
            
            result.Append(lyricsPart);
            result.Append($"[{chord}]");
            currentPos = position;
        }
        
        // Add remaining lyrics
        if (currentPos < lyricsLine.Length)
        {
            result.Append(lyricsLine.Substring(currentPos));
        }

        return result.ToString();
    }

    private string FormatChordOnlyLine(string line)
    {
        // Convert chord-only line to ChordPro format
        var chordPattern = @"\b[A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*(?:/[A-G][#b]?)?\b";
        return Regex.Replace(line, chordPattern, match => $"[{match.Value}]");
    }

    /// <summary>
    /// Provides mock ChordPro content for local development when Google Vision API is not available
    /// </summary>
    private async Task<Result<string>> GetMockChordProContentAsync(string fileName)
    {
        await Task.Delay(1000); // Simulate processing time
        
        // Extract a potential title from the filename
        var title = Path.GetFileNameWithoutExtension(fileName)
            .Replace("_", " ")
            .Replace("-", " ");
        
        // Capitalize first letter of each word
        title = string.Join(" ", title.Split(' ').Select(word => 
            string.IsNullOrEmpty(word) ? word : char.ToUpper(word[0]) + word.Substring(1).ToLower()));
        
        // Generate mock ChordPro content based on the filename
        var mockContent = $@"{{title:{title}}}
{{artist:Unknown Artist}}

[Verse 1]
[C]This is a mock song generated for [G]testing
[Am]The OCR service is using a [F]mock implementation
[C]Because Google Vision API [G]connection failed
[Am]But the feature still works for [F]development

[Chorus]
[F]Mock OCR [C]service is [G]running
[Am]For local [F]development [C]testing[G]
[F]Upload your [C]images and [G]see
[Am]How the feature [F]works seam[C]lessly

[Verse 2]
[C]When you deploy to [G]production
[Am]Make sure Google Vision [F]credentials are set
[C]Then real OCR will [G]process your files
[Am]And extract the actual [F]text content

[Bridge]
[Dm]This mock shows the [Am]ChordPro format
[Bb]With chords in brackets [F]above the lyrics
[Gm]Title and artist [C]metadata included
[Dm]Ready for the choir [Am]app to display";

        _logger.LogInformation("Generated mock ChordPro content for file: {fileName}", fileName);
        return Result.Ok(mockContent);
    }

    // OCR.space API response models
    private class OcrSpaceResponse
    {
        public ParsedResult[]? ParsedResults { get; set; }
        public int OCRExitCode { get; set; }
        public bool IsErroredOnProcessing { get; set; }
        public string? ErrorMessage { get; set; }
    }

    private class ParsedResult
    {
        public string? ParsedText { get; set; }
        public int ErrorCode { get; set; }
        public string? ErrorDetails { get; set; }
    }
}
