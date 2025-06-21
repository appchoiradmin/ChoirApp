using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("PlaylistTemplateSongs")]
public class PlaylistTemplateSong
{
    [Key]
    [Column("template_song_id")]
    public Guid TemplateSongId { get; set; }

    [Required]
    [Column("template_section_id")]
    public Guid TemplateSectionId { get; set; }

    [ForeignKey("TemplateSectionId")]
    public PlaylistTemplateSection? PlaylistTemplateSection { get; set; }

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
