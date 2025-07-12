using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class RemoveSongFromPlaylistEndpoint : EndpointWithoutRequest
    {
        private readonly IPlaylistService _playlistService;

        public RemoveSongFromPlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Delete("/playlists/{playlistId}/songs/{songId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
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

            var result = await _playlistService.RemoveSongFromPlaylistAsync(playlistId, songId);

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
