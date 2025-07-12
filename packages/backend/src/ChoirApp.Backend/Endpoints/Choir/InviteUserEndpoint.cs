using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class InviteUserEndpoint : Endpoint<InviteUserDto>
    {
        private readonly IInvitationService _invitationService;

        public InviteUserEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/choirs/{ChoirId}/invitations");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(InviteUserDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var inviterId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            req.ChoirId = Route<Guid>("ChoirId");

            var result = await _invitationService.CreateInvitationAsync(req, inviterId);

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

            await SendOkAsync(ct);
        }
    }
}
