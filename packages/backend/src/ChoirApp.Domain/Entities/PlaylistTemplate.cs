using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistTemplates")]
public class PlaylistTemplate
{
    [Key]
    [Column("template_id")]
    public Guid TemplateId { get; set; }

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

    public ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
    public ICollection<PlaylistTemplateSection> PlaylistTemplateSections { get; set; } = new List<PlaylistTemplateSection>();
}
