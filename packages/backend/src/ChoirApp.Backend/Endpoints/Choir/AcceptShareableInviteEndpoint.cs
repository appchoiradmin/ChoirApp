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
    public class AcceptShareableInviteEndpoint : Endpoint<AcceptShareableInvitationDto>
    {
        private readonly IInvitationService _invitationService;

        public AcceptShareableInviteEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/invitations/shareable/accept");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(AcceptShareableInvitationDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _invitationService.AcceptShareableInvitationAsync(req, userId);

            if (result.IsFailed)
            {
                if (result.Errors.Any(e => e.Message.Contains("already a member")))
                {
                    await SendAsync(new { message = "You are already a member of this choir." }, 409, ct);
                    return;
                }
                
                if (result.Errors.Any(e => e.Message.Contains("expired") || e.Message.Contains("deactivated") || e.Message.Contains("maximum")))
                {
                    await SendAsync(new { message = result.Errors.First().Message }, 410, ct);
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
