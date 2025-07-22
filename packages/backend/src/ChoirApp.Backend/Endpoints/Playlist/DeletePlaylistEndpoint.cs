using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class DeletePlaylistEndpoint : Endpoint<DeletePlaylistRequest, EmptyResponse>
    {
        private readonly IPlaylistService _playlistService;

        public DeletePlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/playlists/{Id}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(DeletePlaylistRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.DeletePlaylistAsync(req.Id, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }

    public class DeletePlaylistRequest
    {
        public Guid Id { get; set; }
    }
}
