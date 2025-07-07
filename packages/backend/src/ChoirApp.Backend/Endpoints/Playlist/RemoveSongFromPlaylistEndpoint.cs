using ChoirApp.Application.Contracts;
using FastEndpoints;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class RemoveSongFromPlaylistEndpoint : Endpoint<RemoveSongFromPlaylistRequest>
    {
        private readonly IPlaylistService _playlistService;

        public RemoveSongFromPlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Delete("/playlists/{PlaylistId}/songs/{SongId}");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin", "ChoirMember");
        }

        public override async Task HandleAsync(RemoveSongFromPlaylistRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.RemoveSongFromPlaylistAsync(req.PlaylistId, req.SongId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }

    public class RemoveSongFromPlaylistRequest
    {
        public string PlaylistId { get; set; } = default!;
        public string SongId { get; set; } = default!;
    }
}
