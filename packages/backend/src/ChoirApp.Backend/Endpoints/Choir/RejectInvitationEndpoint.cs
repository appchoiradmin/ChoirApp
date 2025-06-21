using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class RejectInvitationEndpoint : Endpoint<RejectInvitationDto>
    {
        private readonly IInvitationService _invitationService;

        public RejectInvitationEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Post("/choirs/invitations/reject");
            Roles("General", "ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(RejectInvitationDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _invitationService.RejectInvitationAsync(req, userId);

            if (result.IsFailed)
            {
                if (result.Errors.Any(e => e.Message.Contains("not for you")))
                {
                    await SendUnauthorizedAsync(ct);
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
