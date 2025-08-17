namespace ChoirApp.Application.Dtos
{
    public class AddSongToPlaylistDto
    {
        public required string SongId { get; set; }
        public required string SectionId { get; set; }
    }
}
