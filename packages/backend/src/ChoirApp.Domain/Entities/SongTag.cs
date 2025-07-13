using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("SongTags")]
public class SongTag
{
    [Required]
    [Column("song_id")]
    public Guid SongId { get; set; }

    [ForeignKey("SongId")]
    public Song? Song { get; set; }

    [Required]
    [Column("tag_id")]
    public Guid TagId { get; set; }

    [ForeignKey("TagId")]
    public Tag? Tag { get; set; }
}
