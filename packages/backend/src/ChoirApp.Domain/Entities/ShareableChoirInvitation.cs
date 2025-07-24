using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;

namespace ChoirApp.Domain.Entities;

[Table("ShareableChoirInvitations")]
public class ShareableChoirInvitation
{
    [Key]
    [Column("invitation_id")]
    public Guid InvitationId { get; private set; }

    [Required]
    [Column("choir_id")]
    public Guid ChoirId { get; private set; }

    [ForeignKey("ChoirId")]
    public Choir? Choir { get; private set; }

    [Required]
    [Column("invitation_token")]
    public string InvitationToken { get; private set; }

    [Required]
    [Column("created_by")]
    public Guid CreatedBy { get; private set; }

    [ForeignKey("CreatedBy")]
    public User? Creator { get; private set; }

    [Required]
    [Column("date_created")]
    public DateTimeOffset DateCreated { get; private set; }

    [Column("expiry_date")]
    public DateTimeOffset? ExpiryDate { get; private set; }

    [Required]
    [Column("is_active")]
    public bool IsActive { get; private set; }

    [Column("max_uses")]
    public int? MaxUses { get; private set; }

    [Column("current_uses")]
    public int CurrentUses { get; private set; }

    // For EF Core
    private ShareableChoirInvitation()
    {
        InvitationToken = string.Empty;
    }

    private ShareableChoirInvitation(Guid choirId, Guid createdBy, DateTimeOffset? expiryDate = null, int? maxUses = null)
    {
        InvitationId = Guid.NewGuid();
        ChoirId = choirId;
        CreatedBy = createdBy;
        InvitationToken = GenerateSecureToken();
        DateCreated = DateTimeOffset.UtcNow;
        ExpiryDate = expiryDate;
        MaxUses = maxUses;
        CurrentUses = 0;
        IsActive = true;
    }

    public static Result<ShareableChoirInvitation> Create(Guid choirId, Guid createdBy, DateTimeOffset? expiryDate = null, int? maxUses = null)
    {
        if (choirId == Guid.Empty)
        {
            return Result.Fail("Choir ID cannot be empty.");
        }

        if (createdBy == Guid.Empty)
        {
            return Result.Fail("Creator ID cannot be empty.");
        }

        if (expiryDate.HasValue && expiryDate.Value <= DateTimeOffset.UtcNow)
        {
            return Result.Fail("Expiry date must be in the future.");
        }

        if (maxUses.HasValue && maxUses.Value <= 0)
        {
            return Result.Fail("Max uses must be greater than zero.");
        }

        var invitation = new ShareableChoirInvitation(choirId, createdBy, expiryDate, maxUses);
        return Result.Ok(invitation);
    }

    public Result<bool> CanBeUsed()
    {
        if (!IsActive)
        {
            return Result.Fail("This invitation link has been deactivated.");
        }

        if (ExpiryDate.HasValue && ExpiryDate.Value <= DateTimeOffset.UtcNow)
        {
            return Result.Fail("This invitation link has expired.");
        }

        if (MaxUses.HasValue && CurrentUses >= MaxUses.Value)
        {
            return Result.Fail("This invitation link has reached its maximum number of uses.");
        }

        return Result.Ok(true);
    }

    public void IncrementUse()
    {
        CurrentUses++;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Reactivate()
    {
        IsActive = true;
    }

    private static string GenerateSecureToken()
    {
        // Generate a more secure token than the simple one used for regular invitations
        var guid1 = Guid.NewGuid().ToString("N")[..8];
        var guid2 = Guid.NewGuid().ToString("N")[..8];
        return $"{guid1}{guid2}".ToLowerInvariant();
    }
}
