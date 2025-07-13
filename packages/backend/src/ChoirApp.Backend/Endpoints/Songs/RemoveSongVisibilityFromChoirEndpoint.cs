using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Services;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class RemoveSongVisibilityFromChoirEndpoint : EndpointWithoutRequest
    {
        private readonly ISongService _songService;

        public RemoveSongVisibilityFromChoirEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/songs/{songId}/visibility/choir/{choirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var choirId = Route<Guid>("choirId");
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _songService.RemoveSongVisibilityFromChoirAsync(
                songId,
                choirId,
                userId);

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
