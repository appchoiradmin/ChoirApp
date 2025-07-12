using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class RemoveMemberRequest
    {
        public Guid ChoirId { get; set; }
        public Guid MemberId { get; set; }
    }

    public class RemoveMemberEndpoint : Endpoint<RemoveMemberRequest>
    {
        private readonly IChoirService _choirService;

        public RemoveMemberEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Delete("/choirs/{ChoirId}/members/{MemberId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(RemoveMemberRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _choirService.RemoveMemberAsync(req.ChoirId, req.MemberId, adminId);

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

            await SendNoContentAsync(ct);
        }
    }
}
