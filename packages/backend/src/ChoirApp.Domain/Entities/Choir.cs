using FluentResults;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

[Table("Choirs")]
public class Choir
{
    [Key]
    [Column("choir_id")]
    public Guid ChoirId { get; private set; }

    [Required]
    [Column("choir_name")]
    public string ChoirName { get; private set; }

    [Required]
    [Column("creation_date")]
    public DateTimeOffset CreationDate { get; private set; }

    [Required]
    [Column("admin_user_id")]
    public Guid AdminUserId { get; private set; }

    [ForeignKey("AdminUserId")]
    public User? Admin { get; private set; }

    public ICollection<ChoirSongVersion> ChoirSongVersions { get; private set; } = new List<ChoirSongVersion>();
    public ICollection<Playlist> Playlists { get; private set; } = new List<Playlist>();
    public ICollection<PlaylistTemplate> PlaylistTemplates { get; private set; } = new List<PlaylistTemplate>();
    public ICollection<UserChoir> UserChoirs { get; private set; } = new List<UserChoir>();

    // Private constructor for EF Core
    private Choir()
    {
        ChoirName = string.Empty;
    }

    private Choir(string choirName, Guid adminUserId)
    {
        ChoirId = Guid.NewGuid();
        ChoirName = choirName;
        AdminUserId = adminUserId;
        CreationDate = DateTimeOffset.UtcNow;
    }

    public static Result<Choir> Create(string choirName, Guid adminUserId)
    {
        if (string.IsNullOrWhiteSpace(choirName))
        {
            return Result.Fail("Choir name cannot be empty.");
        }

        if (adminUserId == Guid.Empty)
        {
            return Result.Fail("A choir must have an admin.");
        }

        var choir = new Choir(choirName, adminUserId);
        return Result.Ok(choir);
    }

    public Result UpdateName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            return Result.Fail("Choir name cannot be empty.");
        }
        
        ChoirName = newName;
        return Result.Ok();
    }

    public Result RemoveMember(Guid memberId, Guid requestingUserId)
    {
        if (requestingUserId != AdminUserId)
        {
            return Result.Fail("Only the choir admin can remove members.");
        }

        if (memberId == AdminUserId)
        {
            return Result.Fail("The choir admin cannot be removed.");
        }

        var userChoir = UserChoirs.FirstOrDefault(uc => uc.UserId == memberId && uc.ChoirId == ChoirId);
        if (userChoir == null)
        {
            return Result.Fail("Member not found in this choir.");
        }

        UserChoirs.Remove(userChoir);
        return Result.Ok();
    }

    public Result AddMember(User user, bool isAdmin = false)
    {
        if (UserChoirs.Any(uc => uc.UserId == user.UserId && uc.ChoirId == ChoirId))
        {
            return Result.Fail("User is already a member of this choir.");
        }

        var userChoir = new UserChoir
        {
            UserId = user.UserId,
            ChoirId = ChoirId,
            User = user,
            Choir = this,
            IsAdmin = isAdmin
        };

        UserChoirs.Add(userChoir);
        return Result.Ok();
    }
}
