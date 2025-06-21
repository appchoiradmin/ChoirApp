using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("ChoirSongVersions")]
public class ChoirSongVersion
{
    [Key]
    [Column("choir_song_id")]
    public Guid ChoirSongId { get; set; }

    [Required]
    [Column("master_song_id")]
    public Guid MasterSongId { get; set; }

    [ForeignKey("MasterSongId")]
    public MasterSong? MasterSong { get; set; }

    [Required]
    [Column("choir_id")]
    public Guid ChoirId { get; set; }

    [ForeignKey("ChoirId")]
    public Choir? Choir { get; set; }

    [Required]
    [Column("edited_lyrics_chordpro")]
    public string EditedLyricsChordPro { get; set; } = string.Empty;

    [Required]
    [Column("last_edited_date")]
    public DateTimeOffset LastEditedDate { get; set; }

    [Required]
    [Column("editor_user_id")]
    public Guid EditorUserId { get; set; }

    [ForeignKey("EditorUserId")]
    public User? Editor { get; set; }
}
