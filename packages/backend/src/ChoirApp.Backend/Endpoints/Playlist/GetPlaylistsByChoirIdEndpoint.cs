using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistsByChoirIdEndpoint : Endpoint<GetPlaylistsByChoirIdRequest, IEnumerable<PlaylistDto>>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistsByChoirIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/choirs/{ChoirId}/playlists");
            AuthSchemes("Bearer");
            Roles("General", "ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(GetPlaylistsByChoirIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistsByChoirIdAsync(req.ChoirId);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var playlists = result.Value;
            var response = playlists.Select(p => new PlaylistDto
            {
                Id = p.PlaylistId,
                Title = p.Title,
                IsPublic = p.IsPublic,
                ChoirId = p.ChoirId,
                Date = p.Date,
                Sections = p.Sections.Select(s => new PlaylistSectionDto
                {
                    Id = s.SectionId,
                    Title = s.Title,
                    Order = s.Order
                }).ToList()
            });

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistsByChoirIdRequest
    {
        public Guid ChoirId { get; set; }
    }
}
