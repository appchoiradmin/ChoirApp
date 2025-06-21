using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;

namespace ChoirApp.Domain.Entities;

public enum InvitationStatus
{
    Pending,
    Accepted,
    Rejected
}

[Table("ChoirInvitations")]
public class ChoirInvitation
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
    [EmailAddress]
    [Column("email")]
    public string Email { get; private set; }

    [Required]
    [Column("invitation_token")]
    public string InvitationToken { get; private set; }

    [Required]
    [Column("status")]
    public InvitationStatus Status { get; private set; }

    [Required]
    [Column("date_sent")]
    public DateTimeOffset DateSent { get; private set; }

    // For EF Core
    private ChoirInvitation()
    {
        Email = string.Empty;
        InvitationToken = string.Empty;
    }

    private ChoirInvitation(Guid choirId, string email)
    {
        InvitationId = Guid.NewGuid();
        ChoirId = choirId;
        Email = email;
        InvitationToken = Path.GetRandomFileName().Replace(".", ""); // Simple token generation
        Status = InvitationStatus.Pending;
        DateSent = DateTimeOffset.UtcNow;
    }

    public static Result<ChoirInvitation> Create(Guid choirId, string email)
    {
        if (choirId == Guid.Empty)
        {
            return Result.Fail("Choir ID cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email))
        {
            return Result.Fail("A valid email is required for an invitation.");
        }

        var invitation = new ChoirInvitation(choirId, email);
        return Result.Ok(invitation);
    }

    public void Accept()
    {
        if (Status == InvitationStatus.Pending)
        {
            Status = InvitationStatus.Accepted;
        }
    }

    public void Reject()
    {
        if (Status == InvitationStatus.Pending)
        {
            Status = InvitationStatus.Rejected;
        }
    }
}
