namespace ChoirApp.Application.Dtos;

public class ChoirSongVersionDto
{
    public Guid ChoirSongId { get; set; }
    public Guid MasterSongId { get; set; }
    public Guid ChoirId { get; set; }
    public string EditedLyricsChordPro { get; set; } = string.Empty;
    public DateTimeOffset LastEditedDate { get; set; }
    public Guid EditorUserId { get; set; }
    public MasterSongDto? MasterSong { get; set; }
}
