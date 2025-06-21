using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("Playlists")]
public class Playlist
{
    [Key]
    [Column("playlist_id")]
    public string PlaylistId { get; set; } = string.Empty;

    [Required]
    [Column("choir_id")]
    public Guid ChoirId { get; set; }

    [ForeignKey("ChoirId")]
    public Choir? Choir { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("creation_date")]
    public DateTimeOffset CreationDate { get; set; }

    [Required]
    [Column("last_modified_date")]
    public DateTimeOffset LastModifiedDate { get; set; }

    [Required]
    [Column("is_public")]
    public bool IsPublic { get; set; }

    [Column("template_id")]
    public Guid? TemplateId { get; set; }

    [ForeignKey("TemplateId")]
    public PlaylistTemplate? PlaylistTemplate { get; set; }

    public ICollection<PlaylistSection> PlaylistSections { get; set; } = new List<PlaylistSection>();
    public ICollection<PlaylistTag> PlaylistTags { get; set; } = new List<PlaylistTag>();
}
