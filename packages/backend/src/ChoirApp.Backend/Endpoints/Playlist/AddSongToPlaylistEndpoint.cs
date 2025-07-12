using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class AddSongToPlaylistEndpoint : Endpoint<AddSongToPlaylistRequest, EmptyResponse>
    {
        private readonly IPlaylistService _playlistService;

        public AddSongToPlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Post("/playlists/{PlaylistId}/songs");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(AddSongToPlaylistRequest req, CancellationToken ct)
        {
            var result = await _playlistService.AddSongToPlaylistAsync(req.PlaylistId, req);

            if (result.IsFailed)
            {
                AddError(result.Errors[0].Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }

    public class AddSongToPlaylistRequest : AddSongToPlaylistDto
    {
        public string PlaylistId { get; set; } = string.Empty;
    }
}
