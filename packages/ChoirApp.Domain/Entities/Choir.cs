using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("Choirs")]
public class Choir
{
    [Key]
    [Column("choir_id")]
    public Guid ChoirId { get; set; }

    [Required]
    [Column("choir_name")]
    public string ChoirName { get; set; } = string.Empty;

    [Required]
    [Column("creation_date")]
    public DateTimeOffset CreationDate { get; set; }

    [Required]
    [Column("admin_user_id")]
    public Guid AdminUserId { get; set; }

    [ForeignKey("AdminUserId")]
    public User? Admin { get; set; }

    public ICollection<ChoirSongVersion> ChoirSongVersions { get; set; } = new List<ChoirSongVersion>();
    public ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
    public ICollection<PlaylistTemplate> PlaylistTemplates { get; set; } = new List<PlaylistTemplate>();
    public ICollection<UserChoir> UserChoirs { get; set; } = new List<UserChoir>();
}
