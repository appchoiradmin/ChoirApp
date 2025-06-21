using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

public enum UserRole
{
    General,
    ChoirAdmin,
    SuperAdmin
}

[Table("Users")]
public class User
{
    [Key]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("google_id")]
    public string GoogleId { get; set; } = string.Empty;

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("role")]
    public UserRole Role { get; set; } = UserRole.General;

    public ICollection<Choir> AdminOfChoirs { get; set; } = new List<Choir>();
    public ICollection<ChoirSongVersion> EditedSongs { get; set; } = new List<ChoirSongVersion>();
    public ICollection<UserChoir> UserChoirs { get; set; } = new List<UserChoir>();
}
