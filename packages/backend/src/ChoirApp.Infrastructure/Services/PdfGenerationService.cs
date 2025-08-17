using ChoirApp.Application.Services;
using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FluentResults;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.RegularExpressions;

namespace ChoirApp.Infrastructure.Services;

public class ParsedLine
{
    public string Type { get; set; } = string.Empty;
    public string? Directive { get; set; }
    public string? Value { get; set; }
    public List<Segment> Segments { get; set; } = new();
}

public class Segment
{
    public string? Chord { get; set; }
    public string Lyric { get; set; } = string.Empty;
}

public class PdfGenerationService : IPdfGenerationService
{
    private readonly IPlaylistRepository _playlistRepository;
    private readonly ISongRepository _songRepository;

    public PdfGenerationService(IPlaylistRepository playlistRepository, ISongRepository songRepository)
    {
        _playlistRepository = playlistRepository;
        _songRepository = songRepository;
        
        // Configure QuestPDF license (Community license for open source)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private List<ParsedLine> ParseChordPro(string text)
    {
        if (string.IsNullOrEmpty(text)) return new List<ParsedLine>();
        
        var lines = text.Split('\n');
        var parsedLines = new List<ParsedLine>();

        foreach (var line in lines)
        {
            if (line.Trim().StartsWith("{"))
            {
                var match = Regex.Match(line, @"\{(.*?):(.*)\}");
                if (match.Success)
                {
                    var directive = match.Groups[1].Value.Trim().ToLower();
                    var value = match.Groups[2].Value.Trim();
                    
                    if (directive == "c" || directive == "comment")
                    {
                        parsedLines.Add(new ParsedLine { Type = "directive", Directive = "comment", Value = value });
                        continue;
                    }
                    if (directive == "t" || directive == "title")
                    {
                        parsedLines.Add(new ParsedLine { Type = "directive", Directive = "title", Value = value });
                        continue;
                    }
                }
            }

            var parts = Regex.Split(line, @"(\[[^\]]+\])").Where(p => !string.IsNullOrEmpty(p)).ToArray();
            if (parts.Length == 0)
            {
                parsedLines.Add(new ParsedLine { Type = "lyrics", Segments = new List<Segment> { new Segment { Chord = null, Lyric = "" } } });
                continue;
            }

            var segments = new List<Segment>();
            for (int i = 0; i < parts.Length; i++)
            {
                var part = parts[i];
                if (part.StartsWith("["))
                {
                    var chord = part.Substring(1, part.Length - 2);
                    var lyric = (i + 1 < parts.Length && !parts[i + 1].StartsWith("[")) ? parts[i + 1] : "";
                    segments.Add(new Segment { Chord = chord, Lyric = lyric });
                    if (!string.IsNullOrEmpty(lyric))
                    {
                        i++;
                    }
                }
                else
                {
                    segments.Add(new Segment { Chord = null, Lyric = part });
                }
            }
            parsedLines.Add(new ParsedLine { Type = "lyrics", Segments = segments });
        }

        return parsedLines;
    }

    private void RenderChordProContent(QuestPDF.Fluent.ColumnDescriptor column, string content)
    {
        var parsedLines = ParseChordPro(content);
        
        foreach (var parsedLine in parsedLines)
        {
            if (parsedLine.Type == "directive")
            {
                // Skip directives like {title:} or {comment:} as we already show song title
                continue;
            }
            
            if (parsedLine.Type == "lyrics")
            {
                // Check if line has any chords
                var hasChords = parsedLine.Segments.Any(s => !string.IsNullOrEmpty(s.Chord));
                
                // Check if this is an empty line (verse separator)
                var isEmpty = parsedLine.Segments.All(s => string.IsNullOrWhiteSpace(s.Lyric) && string.IsNullOrEmpty(s.Chord));
                
                if (isEmpty)
                {
                    // Add larger spacing for verse breaks
                    column.Item().PaddingTop(0.8f, Unit.Centimetre);
                }
                else if (hasChords)
                {
                    // Render chords line first
                    column.Item().PaddingLeft(0.5f, Unit.Centimetre).PaddingTop(0.4f, Unit.Centimetre)
                        .Text(text =>
                        {
                            foreach (var segment in parsedLine.Segments)
                            {
                                if (!string.IsNullOrEmpty(segment.Chord))
                                {
                                    // Add chord without brackets
                                    text.Span(segment.Chord).FontSize(10).FontColor(Colors.Blue.Medium).SemiBold();
                                    // Add spacing to align with lyrics below
                                    if (!string.IsNullOrEmpty(segment.Lyric))
                                    {
                                        var spaces = new string(' ', Math.Max(0, segment.Lyric.Length - segment.Chord.Length));
                                        text.Span(spaces);
                                    }
                                }
                                else if (!string.IsNullOrEmpty(segment.Lyric))
                                {
                                    // Add spaces for lyrics without chords
                                    text.Span(new string(' ', segment.Lyric.Length));
                                }
                            }
                        });
                    
                    // Render lyrics line below chords with small gap
                    column.Item().PaddingLeft(0.5f, Unit.Centimetre).PaddingTop(0.05f, Unit.Centimetre)
                        .Text(text =>
                        {
                            foreach (var segment in parsedLine.Segments)
                            {
                                if (!string.IsNullOrEmpty(segment.Lyric))
                                {
                                    text.Span(segment.Lyric).FontSize(11);
                                }
                            }
                        });
                }
                else
                {
                    // Just render lyrics without chords with proper spacing
                    column.Item().PaddingLeft(0.5f, Unit.Centimetre).PaddingTop(0.3f, Unit.Centimetre)
                        .Text(text =>
                        {
                            foreach (var segment in parsedLine.Segments)
                            {
                                if (!string.IsNullOrEmpty(segment.Lyric))
                                {
                                    text.Span(segment.Lyric).FontSize(11);
                                }
                            }
                        });
                }
            }
        }
    }

    public async Task<Result<byte[]>> GeneratePlaylistPdfAsync(Guid playlistId)
    {
        try
        {
            // Get playlist data with full details (sections and songs)
            var playlist = await _playlistRepository.GetByIdWithFullDetailsAsync(playlistId);
            if (playlist == null)
            {
                return Result.Fail("Playlist not found");
            }

            // Generate PDF with full song content
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .ShowOnce()
                        .Text($"Playlist: {playlist.Name}")
                        .SemiBold().FontSize(16).FontColor(Colors.Blue.Medium);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Item().Text($"Created: {playlist.CreatedAt.ToLocalTime():yyyy-MM-dd}").FontSize(10);
                            column.Item().Text($"Total Songs: {playlist.Sections?.Sum(s => s.PlaylistSongs?.Count ?? 0) ?? 0}").FontSize(10);
                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Add sections and songs with full ChordPro content
                            if (playlist.Sections != null)
                            {
                                foreach (var section in playlist.Sections.Where(s => s.PlaylistSongs?.Any() == true).OrderBy(s => s.Order))
                                {
                                    column.Item().PaddingTop(1, Unit.Centimetre).Text(section.Title).SemiBold().FontSize(14).FontColor(Colors.Blue.Darken1);
                                    
                                    if (section.PlaylistSongs != null)
                                    {
                                        foreach (var playlistSong in section.PlaylistSongs.OrderBy(ps => ps.Order))
                                        {
                                            if (playlistSong.Song != null)
                                            {
                                                // Song title - larger and more prominent
                                                column.Item().PaddingTop(0.8f, Unit.Centimetre).Text(playlistSong.Song.Title).SemiBold().FontSize(16).FontColor(Colors.Black);
                                                
                                                // Artist info
                                                if (!string.IsNullOrEmpty(playlistSong.Song.Artist))
                                                {
                                                    column.Item().Text(playlistSong.Song.Artist).FontSize(10).Italic().FontColor(Colors.Grey.Darken1);
                                                }
                                                
                                                // ChordPro content
                                                if (!string.IsNullOrEmpty(playlistSong.Song.Content))
                                                {
                                                    RenderChordProContent(column, playlistSong.Song.Content);
                                                }
                                                else
                                                {
                                                    column.Item().PaddingLeft(0.5f, Unit.Centimetre).Text("(No content available)").FontSize(10).Italic().FontColor(Colors.Grey.Medium);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text("Generated by AppChoir")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                });
            }).GeneratePdf();

            return Result.Ok(document);
        }
        catch (Exception ex)
        {
            return Result.Fail($"Failed to generate PDF: {ex.Message}");
        }
    }
}
