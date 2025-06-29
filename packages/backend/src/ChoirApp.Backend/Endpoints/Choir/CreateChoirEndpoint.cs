using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class CreateChoirEndpoint : Endpoint<CreateChoirDto, ChoirDto>
    {
        private readonly IChoirService _choirService;

        public CreateChoirEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/choirs");
            AuthSchemes("Bearer");
            Roles("General", "ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(CreateChoirDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!System.Guid.TryParse(userIdClaim, out var adminId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _choirService.CreateChoirAsync(req, adminId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var choir = result.Value;
            var response = new ChoirDto
            {
                Id = choir.ChoirId,
                Name = choir.ChoirName,
                AdminId = choir.AdminUserId
            };

            await SendAsync(response, 201, ct);
        }
    }
}
