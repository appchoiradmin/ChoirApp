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
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
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
                IsDefault = t.IsDefault,
                Sections = t.Sections
                    .OrderBy(s => s.Order)
                    .Select(s => new PlaylistTemplateSectionDto
                    {
                        Id = s.TemplateSectionId,
                        Title = s.Title,
                        Order = s.Order,
                        // PlaylistTemplateSongs entity has been removed
                        Songs = new List<PlaylistSongDto>()
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
