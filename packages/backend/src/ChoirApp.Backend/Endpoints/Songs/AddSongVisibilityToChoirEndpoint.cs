using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Services;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class AddSongVisibilityToChoirEndpoint : Endpoint<AddSongVisibilityToChoirRequest>
    {
        private readonly ISongService _songService;

        public AddSongVisibilityToChoirEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("POST");
            Routes("/songs/{songId}/visibility/choir");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(AddSongVisibilityToChoirRequest req, CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _songService.AddSongVisibilityToChoirAsync(
                songId,
                req.ChoirId,
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
