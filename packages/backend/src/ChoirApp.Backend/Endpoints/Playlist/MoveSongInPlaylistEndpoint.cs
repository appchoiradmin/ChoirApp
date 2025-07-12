using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class MoveSongInPlaylistRequest
    {
        public string FromSectionId { get; set; } = string.Empty;
        public string ToSectionId { get; set; } = string.Empty;
    }

    public class MoveSongInPlaylistEndpoint : Endpoint<MoveSongInPlaylistRequest>
    {
        private readonly IPlaylistService _playlistService;

        public MoveSongInPlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Post("/playlists/{playlistId}/songs/{songId}/move");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(MoveSongInPlaylistRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!System.Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            // Extract route parameters
            var playlistId = Route<string>("playlistId");
            var songId = Route<string>("songId");

            if (string.IsNullOrEmpty(playlistId) || string.IsNullOrEmpty(songId))
            {
                ThrowError("Invalid playlist or song ID.");
                return;
            }

            var result = await _playlistService.MoveSongInPlaylistAsync(
                playlistId, songId, req.FromSectionId, req.ToSectionId, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }
}
