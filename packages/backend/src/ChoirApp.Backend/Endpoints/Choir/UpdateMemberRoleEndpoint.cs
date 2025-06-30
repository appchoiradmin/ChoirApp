using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class UpdateMemberRoleEndpoint : Endpoint<UpdateMemberRoleRequest>
    {
        private readonly IChoirService _choirService;

        public UpdateMemberRoleEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Verbs("PUT", "OPTIONS");
            Routes("/choirs/{choirId}/members/{memberId}/role");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(UpdateMemberRoleRequest req, CancellationToken ct)
        {
            var adminIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(adminIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var choirId = Route<Guid>("choirId");
            var memberId = Route<Guid>("memberId");

            var result = await _choirService.UpdateMemberRoleAsync(choirId, memberId, req.Role, adminId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendNoContentAsync(ct);
        }
    }
}
