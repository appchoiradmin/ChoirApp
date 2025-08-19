using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;

using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class UpdateChoirRequest
    {
        public Guid ChoirId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateChoirEndpoint : Endpoint<UpdateChoirRequest>
    {
        private readonly IChoirService _choirService;

        public UpdateChoirEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Put("/choirs/{ChoirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(UpdateChoirRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var dto = new UpdateChoirDto
            {
                Name = req.Name,
                Address = req.Address,
                Notes = req.Notes
            };

            var result = await _choirService.UpdateChoirAsync(req.ChoirId, dto, adminId);

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
