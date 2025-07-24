using ChoirApp.Application.Contracts;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Choir;

public class GetShareableInviteInfoRequest
{
    public string InvitationToken { get; set; } = string.Empty;
}

public class GetShareableInviteInfoResponse
{
    public string ChoirName { get; set; } = string.Empty;
    public Guid ChoirId { get; set; }
    public bool IsValid { get; set; }
    public bool IsExpired { get; set; }
    public string? ErrorMessage { get; set; }
}

public class GetShareableInviteInfoEndpoint : Endpoint<GetShareableInviteInfoRequest, GetShareableInviteInfoResponse>
{
    private readonly IInvitationRepository _invitationRepository;

    public GetShareableInviteInfoEndpoint(IInvitationRepository invitationRepository)
    {
        _invitationRepository = invitationRepository;
    }

    public override void Configure()
    {
        Verbs("GET", "OPTIONS");
        Routes("/invite/{InvitationToken}");
        AllowAnonymous(); // Allow anonymous access to check invitation validity
    }

    public override async Task HandleAsync(GetShareableInviteInfoRequest req, CancellationToken ct)
    {
        req.InvitationToken = Route<string>("InvitationToken");

        var invitation = await _invitationRepository.GetByTokenAsync(req.InvitationToken);

        if (invitation == null)
        {
            await SendOkAsync(new GetShareableInviteInfoResponse
            {
                IsValid = false,
                ErrorMessage = "Invalid invitation token."
            }, ct);
            return;
        }

        // Check if this is a shareable invitation
        if (invitation.Email != "SHAREABLE_INVITE@choirapp.local")
        {
            await SendOkAsync(new GetShareableInviteInfoResponse
            {
                IsValid = false,
                ErrorMessage = "This is not a shareable invitation link."
            }, ct);
            return;
        }

        // Check if invitation has expired (24 hours)
        var expirationTime = invitation.DateSent.AddHours(24);
        var isExpired = DateTimeOffset.UtcNow > expirationTime;

        if (invitation.Status != Domain.Entities.InvitationStatus.Pending)
        {
            await SendOkAsync(new GetShareableInviteInfoResponse
            {
                IsValid = false,
                ErrorMessage = "This invitation has already been used."
            }, ct);
            return;
        }

        await SendOkAsync(new GetShareableInviteInfoResponse
        {
            ChoirName = invitation.Choir?.ChoirName ?? "Unknown Choir",
            ChoirId = invitation.ChoirId,
            IsValid = !isExpired,
            IsExpired = isExpired,
            ErrorMessage = isExpired ? "This invitation link has expired. Please ask the choir admin for a new link." : null
        }, ct);
    }
}
