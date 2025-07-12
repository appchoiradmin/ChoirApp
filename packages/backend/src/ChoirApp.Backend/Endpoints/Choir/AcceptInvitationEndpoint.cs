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
    public class AcceptInvitationEndpoint : Endpoint<AcceptInvitationDto>
    {
        private readonly IInvitationService _invitationService;

        public AcceptInvitationEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/invitations/accept");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(AcceptInvitationDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _invitationService.AcceptInvitationAsync(req, userId);

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
