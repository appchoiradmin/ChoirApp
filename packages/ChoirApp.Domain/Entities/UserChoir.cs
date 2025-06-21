using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("UserChoirs")]
public class UserChoir
{
    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Required]
    [Column("choir_id")]
    public Guid ChoirId { get; set; }

    [ForeignKey("ChoirId")]
    public Choir? Choir { get; set; }
}
