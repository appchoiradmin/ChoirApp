using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistByIdEndpoint : Endpoint<GetPlaylistByIdRequest, PlaylistDto>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistByIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Get("/playlists/{Id}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(GetPlaylistByIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistByIdAsync(req.Id);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var playlist = result.Value;
            var response = new PlaylistDto
            {
                Id = playlist.PlaylistId,
                Title = playlist.Title,
                IsPublic = playlist.IsPublic,
                ChoirId = playlist.ChoirId,
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
                }).ToList(),
                Tags = playlist.PlaylistTags.Where(pt => pt.Tag != null).Select(pt => pt.Tag!.TagName).ToList()
            };

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistByIdRequest
    {
        public Guid Id { get; set; }
    }
}
