using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class CreatePlaylistEndpoint : Endpoint<CreatePlaylistDto, PlaylistDto>
    {
        private readonly IPlaylistService _playlistService;

        public CreatePlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/playlists");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(CreatePlaylistDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.CreatePlaylistAsync(req, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var playlist = result.Value;
            var response = new PlaylistDto
            {
                Id = playlist.PlaylistId,
                Title = playlist.Title,
                IsPublic = playlist.IsPublic,
                ChoirId = playlist.ChoirId,
                Date = playlist.Date,
                PlaylistTemplateId = playlist.PlaylistTemplateId,
                Sections = playlist.Sections.Select(s => new PlaylistSectionDto
                {
                    Id = s.SectionId,
                    Title = s.Title,
                    Order = s.Order,
                    Songs = s.PlaylistSongs.Select(ps => new PlaylistSongDto
                    {
                        Id = ps.PlaylistSongId,
                        Order = ps.Order,
                        MasterSongId = ps.MasterSongId,
                        ChoirSongVersionId = ps.ChoirSongVersionId
                    }).ToList()
                }).ToList()
            };

            await SendAsync(response, 201, ct);
        }
    }
}
