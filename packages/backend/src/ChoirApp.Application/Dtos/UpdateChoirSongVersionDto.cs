namespace ChoirApp.Application.Dtos;

public class UpdateChoirSongVersionDto
{
    public string EditedLyricsChordPro { get; set; } = string.Empty;
    public Guid EditorUserId { get; set; }
}
