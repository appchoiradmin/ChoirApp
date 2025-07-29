using System.Text;
using FluentResults;
using ChoirApp.Application.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Mscc.GenerativeAI;

namespace ChoirApp.Infrastructure.Services;

public class SheetMusicTranscriptionService : ISheetMusicTranscriptionService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SheetMusicTranscriptionService> _logger;
    private readonly GenerativeModel? _geminiModel;
    private readonly bool _useMockImplementation;

    public SheetMusicTranscriptionService(IConfiguration configuration, ILogger<SheetMusicTranscriptionService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        try
        {
            // Initialize Gemini Vision model
            var apiKey = _configuration["GoogleAI:ApiKey"] ?? Environment.GetEnvironmentVariable("GOOGLE_AI_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Google AI API key not found. Set GOOGLE_AI_API_KEY environment variable or GoogleAI:ApiKey configuration.");
            }
            
            var googleAI = new GoogleAI(apiKey);
            _geminiModel = googleAI.GenerativeModel(model: "gemini-1.5-flash");
            _useMockImplementation = false;
            _logger.LogInformation("Gemini Vision API client initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to initialize Gemini Vision API client. Using mock implementation for local development. Make sure GOOGLE_AI_API_KEY is set for production.");
            _geminiModel = null;
            _useMockImplementation = true;
        }
    }

    public async Task<Result<string>> ConvertImageToChordProAsync(Stream imageStream, string fileName)
    {
        if (_useMockImplementation)
        {
            _logger.LogInformation("Using mock OCR implementation for file: {fileName}", fileName);
            return await GetMockChordProContentAsync(fileName);
        }

        if (_geminiModel == null)
        {
            return Result.Fail("Gemini Vision API client not initialized. Please configure Google AI API key.");
        }

        try
        {
            _logger.LogInformation("Converting image {fileName} to ChordPro format using Gemini Vision API", fileName);
            
            // Create the prompt for ChordPro conversion
            var prompt = @"You are a music transcription expert. Analyze this sheet music image and convert it to ChordPro format.

=== CRITICAL CHORDPRO FORMAT RULES ===

1. INLINE CHORD PLACEMENT:
   - Chords go IMMEDIATELY before the syllable: [C]A-[F]ma-[G]zing [C]grace
   - NEVER create separate chord lines above lyrics
   - Each chord [CHORD] must be directly attached to its syllable

2. CHORD NOTATION:
   - Keep solfege notation as-is: RE, LA, MI, SOL, SI, FA, DO
   - Use brackets: [RE], [LA], [MI], [SOL], [SI], [FA], [DO]
   - Mixed case chords: [mim], [lam], [sim] for minor chords
   - Complex chords: [RE7], [LA7], [DO#m], [SOL#m]

3. SONG STRUCTURE:
   - Start with: {title: Song Title}
   - Add: {artist: Artist Name}
   - Optional: {key: Key}
   - Sections: {start_of_verse}, {end_of_verse}, {start_of_chorus}, {end_of_chorus}

4. CHORD PLACEMENT PRINCIPLES:
   - Chords appear inline with lyrics: [C]Amazing [G]grace [Am]how [F]sweet
   - Multiple chords per line: [G]Holy [C]holy [Am]holy [F]Lord [G]God
   - Mixed notation styles: [RE], [mim], [DO7], [LA#], [Bb], [Cm]
   - Punctuation stays with lyrics: [G]grace, [C]how [F]sweet!

5. WRONG FORMAT (NEVER DO THIS):
   C    G    Am   F
   Amazing grace how sweet
   
   This separates chords from lyrics - FORBIDDEN!

6. VISUAL ANALYSIS - CRITICAL:
   - ONLY place chords where they actually appear above lyrics in the image
   - DO NOT put chords on every syllable - only where you see them
   - Look at the horizontal alignment of each chord with the syllable below it
   - If no chord appears above a syllable, don't add one
   - Some lyrics may have no chords at all

7. SPACING AND FLOW:
   - Maintain natural word spacing
   - Use hyphens for syllable breaks when chords split words
   - Keep punctuation with lyrics: [G]grace, [C]how [F]sweet

=== VISUAL ANALYSIS INSTRUCTIONS ===

Step 1: CAREFULLY examine the sheet music image
Step 2: Identify where chords appear ABOVE the lyrics
Step 3: Note the exact syllable each chord is positioned over
Step 4: Create ChordPro format placing [CHORD] only before syllables that have chords above them

GENERAL PRINCIPLES:
- Look at the horizontal alignment of each chord with the text below it
- Place [CHORD] immediately before the syllable that has a chord above it
- If multiple chords appear above one word, place each chord before its corresponding syllable
- If no chord appears above a section of lyrics, don't add any chords there
- Some songs may have sparse chord placement, others may be chord-heavy
- Respect the original spacing and rhythm indicated by the chord positions

Return ONLY the ChordPro formatted text, no additional explanation.";

            // Create the request with the image
            var request = new GenerateContentRequest(prompt);
            
            // Convert stream to byte array for the API
            using var memoryStream = new MemoryStream();
            await imageStream.CopyToAsync(memoryStream);
            var imageBytes = memoryStream.ToArray();
            var mimeType = GetMimeType(fileName);
            
            // Create a temporary file for the image data
            var tempFilePath = Path.GetTempFileName();
            var tempFileWithExtension = Path.ChangeExtension(tempFilePath, Path.GetExtension(fileName));
            
            try
            {
                // Write the image bytes to the temporary file
                await File.WriteAllBytesAsync(tempFileWithExtension, imageBytes);
                
                // Add the image file to the request
                await request.AddMedia(tempFileWithExtension);
            }
            finally
            {
                // Clean up temporary files
                if (File.Exists(tempFilePath)) File.Delete(tempFilePath);
                if (File.Exists(tempFileWithExtension)) File.Delete(tempFileWithExtension);
            }
            
            // Generate the ChordPro content
            var response = await _geminiModel.GenerateContent(request);
            
            if (string.IsNullOrEmpty(response?.Text))
            {
                _logger.LogWarning("Gemini Vision API returned empty response for {fileName}", fileName);
                return Result.Fail("No content generated from the image. Please ensure the image contains readable sheet music.");
            }
            
            _logger.LogInformation("Successfully converted image {fileName} to ChordPro format. Generated {length} characters.", fileName, response.Text.Length);
            return Result.Ok(response.Text);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting image {FileName} to ChordPro format using Gemini Vision API", fileName);
            return Result.Fail($"Failed to convert image: {ex.Message}");
        }
    }



    private string GetMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/jpeg" // Default fallback
        };
    }

    private async Task<Result<string>> GetMockChordProContentAsync(string fileName)
    {
        _logger.LogInformation("Generating mock ChordPro content for file: {fileName}", fileName);
        
        // Return a realistic mock ChordPro content for development/testing
        var mockContent = @"{title: Amazing Grace}
{artist: John Newton}

{start_of_verse}
[C]Amazing [F]grace how [C]sweet the [G]sound
That [C]saved a [F]wretch like [C]me
I [C]once was [F]lost but [C]now am [G]found
Was [C]blind but [G]now I [C]see
{end_of_verse}

{start_of_verse}
'Twas [C]grace that [F]taught my [C]heart to [G]fear
And [C]grace my [F]fears re[C]lieved
How [C]precious [F]did that [C]grace ap[G]pear
The [C]hour I [G]first be[C]lieved
{end_of_verse}";

        await Task.Delay(500); // Simulate processing time
        return Result.Ok(mockContent);
    }
}
