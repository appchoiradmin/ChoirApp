using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class GetChoirInvitationsEndpoint : Endpoint<GetChoirInvitationsRequest, List<InvitationDto>>
    {
        private readonly IInvitationService _invitationService;
        private readonly IChoirService _choirService;

        public GetChoirInvitationsEndpoint(IInvitationService invitationService, IChoirService choirService)
        {
            _invitationService = invitationService;
            _choirService = choirService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/choirs/{ChoirId}/invitations");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.GeneralUser));
        }

        public override async Task HandleAsync(GetChoirInvitationsRequest req, CancellationToken ct)
        {
            req.ChoirId = Route<Guid>("ChoirId");
            
            // Get the current user ID from claims
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                await SendForbiddenAsync(ct);
                return;
            }
            
            // Check if the user is the admin of this choir
            var choirResult = await _choirService.GetChoirByIdAsync(req.ChoirId);
            if (choirResult.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }
            
            var choir = choirResult.Value;
            
            // Allow access if the user is the admin of this choir or has the ChoirAdmin role
            if (choir.AdminUserId != userId)
            {
                var roleClaimValue = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
                if (roleClaimValue != nameof(UserRole.ChoirAdmin))
                {
                    await SendForbiddenAsync(ct);
                    return;
                }
            }
            
            var invitations = await _invitationService.GetInvitationsByChoirAsync(req.ChoirId);
            await SendOkAsync(invitations, ct);
        }
    }

    public class GetChoirInvitationsRequest
    {
        public Guid ChoirId { get; set; }
    }
}
