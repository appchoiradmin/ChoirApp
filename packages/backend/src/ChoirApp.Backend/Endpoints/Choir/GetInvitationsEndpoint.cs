using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class GetInvitationsEndpoint : EndpointWithoutRequest<List<InvitationDto>>
    {
        private readonly IInvitationService _invitationService;

        public GetInvitationsEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/invitations");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var invitations = await _invitationService.GetInvitationsAsync(userId);
            await SendOkAsync(invitations, ct);
        }
    }
}
