using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("Tags")]
public class Tag
{
    [Key]
    [Column("tag_id")]
    public Guid TagId { get; set; }

    [Required]
    [Column("tag_name")]
    public string TagName { get; set; } = string.Empty;

    public ICollection<SongTag> SongTags { get; set; } = new List<SongTag>();
    public ICollection<PlaylistTag> PlaylistTags { get; set; } = new List<PlaylistTag>();
}
