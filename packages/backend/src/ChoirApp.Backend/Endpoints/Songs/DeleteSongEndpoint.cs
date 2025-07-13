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
    public class DeleteSongEndpoint : EndpointWithoutRequest
    {
        private readonly ISongService _songService;

        public DeleteSongEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/songs/{songId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _songService.DeleteSongAsync(songId, userId);

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
