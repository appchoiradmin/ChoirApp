using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos;

public class CreateChoirSongVersionDto
{
    [Required]
    public Guid MasterSongId { get; set; }
    
    [Required]
    public string EditedLyricsChordPro { get; set; } = string.Empty;
}
