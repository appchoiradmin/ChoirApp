using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Choir;

public class CreateShareableInviteResponse
{
    public string InviteLink { get; set; } = string.Empty;
    public string InvitationToken { get; set; } = string.Empty;
}

public class CreateShareableInviteEndpoint : EndpointWithoutRequest<CreateShareableInviteResponse>
{
    private readonly IInvitationService _invitationService;
    private readonly IConfiguration _configuration;

    public CreateShareableInviteEndpoint(IInvitationService invitationService, IConfiguration configuration)
    {
        _invitationService = invitationService;
        _configuration = configuration;
    }

    public override void Configure()
    {
        Verbs("POST", "OPTIONS");
        Routes("/choirs/{ChoirId}/shareable-invite");
        AuthSchemes("Bearer");
        Roles(nameof(UserRole.ChoirAdmin));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var inviterId))
        {
            ThrowError("User not authenticated properly.");
            return;
        }

        var choirId = Route<Guid>("ChoirId");

        var result = await _invitationService.CreateShareableInvitationAsync(choirId, inviterId);

        if (result.IsFailed)
        {
            if (result.Errors.Any(e => e.Message.Contains("Only the choir admin")))
            {
                await SendUnauthorizedAsync(ct);
                return;
            }
            AddError(result.Errors.First().Message);
            await SendErrorsAsync(cancellation: ct);
            return;
        }

        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        var inviteLink = $"{frontendUrl}/invite/{result.Value}";

        await SendOkAsync(new CreateShareableInviteResponse
        {
            InviteLink = inviteLink,
            InvitationToken = result.Value
        }, ct);
    }
}
