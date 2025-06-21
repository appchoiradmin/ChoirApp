using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("MasterSongs")]
public class MasterSong
{
    [Key]
    [Column("song_id")]
    public Guid SongId { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("artist")]
    public string? Artist { get; set; }

    [Required]
    [Column("lyrics_chordpro")]
    public string LyricsChordPro { get; set; } = string.Empty;

    public ICollection<SongTag> SongTags { get; set; } = new List<SongTag>();
    public ICollection<ChoirSongVersion> ChoirSongVersions { get; set; } = new List<ChoirSongVersion>();
}
