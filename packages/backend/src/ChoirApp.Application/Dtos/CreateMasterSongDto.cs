using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos;

public class CreateMasterSongDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Artist { get; set; }

    [Required]
    public string LyricsChordPro { get; set; } = string.Empty;

    public ICollection<string> Tags { get; set; } = new List<string>();
}
