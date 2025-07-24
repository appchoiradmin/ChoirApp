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
    public class GetShareableInvitesByChoirRequest
    {
        public Guid ChoirId { get; set; }
    }

    public class GetShareableInvitesByChoirEndpoint : Endpoint<GetShareableInvitesByChoirRequest>
    {
        private readonly IInvitationService _invitationService;

        public GetShareableInvitesByChoirEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/invitations/shareable/choir/{choirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(GetShareableInvitesByChoirRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var invitations = await _invitationService.GetShareableInvitationsByChoirAsync(req.ChoirId);

            await SendOkAsync(invitations, ct);
        }
    }
}
