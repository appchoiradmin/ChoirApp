using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistSongs")]
public class PlaylistSong
{
    [Key]
    [Column("playlist_song_id")]
    public Guid PlaylistSongId { get; set; }

    [Required]
    [Column("section_id")]
    public Guid SectionId { get; set; }

    [ForeignKey("SectionId")]
    public PlaylistSection? PlaylistSection { get; set; }

    [Required]
    [Column("song_id")]
    public Guid SongId { get; set; }

    [Required]
    [Column("is_master_song")]
    public bool IsMasterSong { get; set; }

    [Required]
    [Column("order_index")]
    public int OrderIndex { get; set; }
}
