using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class GetPlaylistTemplateByIdEndpoint : Endpoint<GetPlaylistTemplateByIdRequest, PlaylistTemplateDto>
    {
        private readonly IPlaylistService _playlistService;

        public GetPlaylistTemplateByIdEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Get("/playlist-templates/{Id}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(GetPlaylistTemplateByIdRequest req, CancellationToken ct)
        {
            var result = await _playlistService.GetPlaylistTemplateByIdAsync(req.Id);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var template = result.Value;
            var response = new PlaylistTemplateDto
            {
                Id = template.TemplateId,
                Title = template.Title,
                Description = template.Description,
                ChoirId = template.ChoirId,
                Sections = template.Sections.Select(s => new PlaylistTemplateSectionDto
                {
                    Id = s.TemplateSectionId,
                    Title = s.Title,
                    Order = s.Order,
                    Songs = s.PlaylistTemplateSongs.Select(ps => new PlaylistSongDto
                    {
                        Id = ps.TemplateSongId,
                        Order = ps.Order,
                        MasterSongId = ps.MasterSongId,
                        ChoirSongVersionId = ps.ChoirSongVersionId
                    }).ToList()
                }).ToList()
            };

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetPlaylistTemplateByIdRequest
    {
        public Guid Id { get; set; }
    }
}
