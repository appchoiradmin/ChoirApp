using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class CreatePlaylistTemplateEndpoint : Endpoint<CreatePlaylistTemplateDto, PlaylistTemplateDto>
    {
        private readonly IPlaylistService _playlistService;

        public CreatePlaylistTemplateEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/playlist-templates");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CreatePlaylistTemplateDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
            {
                userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;
            }
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.CreatePlaylistTemplateAsync(req, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var template = result.Value;
            var response = new PlaylistTemplateDto
            {
                Id = template.TemplateId,
                Title = template.Title,
                Description = template.Description,
                ChoirId = template.ChoirId
            };

            await SendAsync(response, 201, ct);
        }
    }
}
