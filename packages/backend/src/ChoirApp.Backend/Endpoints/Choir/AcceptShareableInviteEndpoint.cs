using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class AcceptShareableInviteRequest
    {
        public string InvitationToken { get; set; } = string.Empty;
    }

    public class AcceptShareableInviteEndpoint : Endpoint<AcceptShareableInviteRequest>
    {
        private readonly IInvitationService _invitationService;

        public AcceptShareableInviteEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/invite/{InvitationToken}/accept");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(AcceptShareableInviteRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            req.InvitationToken = Route<string>("InvitationToken");

            var result = await _invitationService.AcceptShareableInvitationAsync(req.InvitationToken, userId);

            if (result.IsFailed)
            {
                if (result.Errors.Any(e => e.Message.Contains("expired")))
                {
                    AddError(result.Errors.First().Message);
                    await SendErrorsAsync(410, ct); // Gone
                    return;
                }
                if (result.Errors.Any(e => e.Message.Contains("already a member")))
                {
                    AddError(result.Errors.First().Message);
                    await SendErrorsAsync(409, ct); // Conflict
                    return;
                }
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }
}
