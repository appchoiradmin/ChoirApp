using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
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
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(GetPlaylistTemplateByIdRequest req, CancellationToken ct)
        {
            Console.WriteLine($"🚨 DEBUG - GetPlaylistTemplateByIdEndpoint called with ID: {req.Id}");
            
            var result = await _playlistService.GetPlaylistTemplateByIdAsync(req.Id);

            Console.WriteLine($"🚨 DEBUG - Service result: IsFailed={result.IsFailed}");
            
            if (result.IsFailed)
            {
                Console.WriteLine($"🚨 DEBUG - Service failed with errors: {string.Join(", ", result.Errors.Select(e => e.Message))}");
                await SendNotFoundAsync(ct);
                return;
            }

            var template = result.Value;
            Console.WriteLine($"🚨 DEBUG - Template found: ID={template.TemplateId}, Title={template.Title}, Sections={template.Sections.Count}");
            
            try
            {
                var response = new PlaylistTemplateDto
                {
                    Id = template.TemplateId,
                    Title = template.Title,
                    Description = template.Description,
                    ChoirId = template.ChoirId,
                    IsDefault = template.IsDefault,
                    Sections = template.Sections.Select(s => new PlaylistTemplateSectionDto
                    {
                        Id = s.TemplateSectionId,
                        Title = s.Title,
                        Order = s.Order,
                        Songs = new List<PlaylistSongDto>()
                    }).ToList()
                };

                Console.WriteLine($"🚨 DEBUG - Response created successfully, sending to client");
                await SendAsync(response, cancellation: ct);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🚨 DEBUG - Exception creating response: {ex.Message}");
                Console.WriteLine($"🚨 DEBUG - Exception stack trace: {ex.StackTrace}");
                await SendNotFoundAsync(ct);
            }
        }
    }

    public class GetPlaylistTemplateByIdRequest
    {
        public Guid Id { get; set; }
    }
}
