using ChoirApp.Application.Contracts;
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
        public CreateChoirDto Dto { get; set; } = null!;
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
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(UpdateChoirRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _choirService.UpdateChoirAsync(req.ChoirId, req.Dto, adminId);

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
