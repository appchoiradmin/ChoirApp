using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistTemplatesByChoirIdEndpoint : Endpoint<GetPlaylistTemplatesByChoirIdRequest, IEnumerable<PlaylistTemplateDto>>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistTemplatesByChoirIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/choirs/{ChoirId}/playlist-templates");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(GetPlaylistTemplatesByChoirIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistTemplatesByChoirIdAsync(req.ChoirId);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var templates = result.Value;
            var response = templates.Select(t => new PlaylistTemplateDto
            {
                Id = t.TemplateId,
                Title = t.Title,
                Description = t.Description,
                ChoirId = t.ChoirId,
                Sections = t.Sections
                    .OrderBy(s => s.Order)
                    .Select(s => new PlaylistTemplateSectionDto
                    {
                        Id = s.TemplateSectionId,
                        Title = s.Title,
                        Order = s.Order,
                        Songs = s.PlaylistTemplateSongs != null
                            ? s.PlaylistTemplateSongs.OrderBy(ps => ps.Order).Select(ps => new PlaylistSongDto
                                {
                                    Id = ps.TemplateSongId,
                                    Order = ps.Order,
                                    MasterSongId = ps.MasterSongId,
                                    ChoirSongVersionId = ps.ChoirSongVersionId
                                }).ToList()
                            : new List<PlaylistSongDto>()
                    }).ToList()
            });

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistTemplatesByChoirIdRequest
    {
        public Guid ChoirId { get; set; }
    }
}
