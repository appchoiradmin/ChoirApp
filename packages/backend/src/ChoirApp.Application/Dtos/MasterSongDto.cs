namespace ChoirApp.Application.Dtos;

public class MasterSongDto
{
    public Guid SongId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Artist { get; set; }
    public string LyricsChordPro { get; set; } = string.Empty;
    public ICollection<TagDto> Tags { get; set; } = new List<TagDto>();
}
