using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("SongVisibilities")]
public class SongVisibility
{
    [Key]
    [Column("visibility_id")]
    public Guid VisibilityId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("song_id")]
    public Guid SongId { get; set; }

    [ForeignKey("SongId")]
    public Song? Song { get; set; }

    [Required]
    [Column("choir_id")]
    public Guid ChoirId { get; set; }

    [ForeignKey("ChoirId")]
    public Choir? Choir { get; set; }
}
