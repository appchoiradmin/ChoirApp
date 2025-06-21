using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistTemplateSections")]
public class PlaylistTemplateSection
{
    [Key]
    [Column("template_section_id")]
    public Guid TemplateSectionId { get; set; }

    [Required]
    [Column("template_id")]
    public Guid TemplateId { get; set; }

    [ForeignKey("TemplateId")]
    public PlaylistTemplate? PlaylistTemplate { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("order_index")]
    public int OrderIndex { get; set; }

    public ICollection<PlaylistTemplateSong> PlaylistTemplateSongs { get; set; } = new List<PlaylistTemplateSong>();
}
