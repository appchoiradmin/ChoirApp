using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistTags")]
public class PlaylistTag
{
    [Required]
    [Column("playlist_id")]
    public string PlaylistId { get; set; } = string.Empty;

    [ForeignKey("PlaylistId")]
    public Playlist? Playlist { get; set; }

    [Required]
    [Column("tag_id")]
    public Guid TagId { get; set; }

    [ForeignKey("TagId")]
    public Tag? Tag { get; set; }
}
