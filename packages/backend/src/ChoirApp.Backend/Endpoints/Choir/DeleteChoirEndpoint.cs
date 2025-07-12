using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class DeleteChoirRequest
    {
        public Guid ChoirId { get; set; }
    }

    public class DeleteChoirEndpoint : Endpoint<DeleteChoirRequest>
    {
        private readonly IChoirService _choirService;

        public DeleteChoirEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Delete("/choirs/{ChoirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(DeleteChoirRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _choirService.DeleteChoirAsync(req.ChoirId, adminId);

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
