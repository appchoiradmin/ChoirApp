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
    public class CreateShareableInviteEndpoint : Endpoint<CreateShareableInvitationDto, ShareableInvitationDto>
    {
        private readonly IInvitationService _invitationService;

        public CreateShareableInviteEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/invitations/shareable");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CreateShareableInvitationDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _invitationService.CreateShareableInvitationAsync(req, userId);

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

            await SendCreatedAtAsync<GetShareableInviteEndpoint>(
                new { token = result.Value.InvitationToken }, 
                result.Value, 
                cancellation: ct);
        }
    }
}
