using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistSections")]
public class PlaylistSection
{
    [Key]
    [Column("section_id")]
    public Guid SectionId { get; set; }

    [Required]
    [Column("playlist_id")]
    public string PlaylistId { get; set; } = string.Empty;

    [ForeignKey("PlaylistId")]
    public Playlist? Playlist { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("order_index")]
    public int OrderIndex { get; set; }

    public ICollection<PlaylistSong> PlaylistSongs { get; set; } = new List<PlaylistSong>();
}
