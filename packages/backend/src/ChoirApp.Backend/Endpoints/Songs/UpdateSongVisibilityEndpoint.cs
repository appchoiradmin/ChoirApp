using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class UpdateSongVisibilityEndpoint : Endpoint<UpdateSongVisibilityRequest>
    {
        private readonly ISongService _songService;

        public UpdateSongVisibilityEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("PUT");
            Routes("/songs/{songId}/visibility");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(UpdateSongVisibilityRequest req, CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _songService.UpdateSongVisibilityAsync(
                songId,
                (Domain.Entities.SongVisibilityType)req.Visibility,
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
