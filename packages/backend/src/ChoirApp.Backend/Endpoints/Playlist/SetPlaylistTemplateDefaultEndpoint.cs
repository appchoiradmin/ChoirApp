using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class SetPlaylistTemplateDefaultEndpoint : Endpoint<SetPlaylistTemplateDefaultRequest, EmptyResponse>
    {
        private readonly IPlaylistService _playlistService;

        public SetPlaylistTemplateDefaultEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("PUT", "OPTIONS");
            Routes("/playlist-templates/{Id}/set-default");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(SetPlaylistTemplateDefaultRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var templateId = Route<Guid>("Id");

            var result = await _playlistService.SetPlaylistTemplateDefaultAsync(templateId, req.Dto, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendNoContentAsync(ct);
        }
    }

    public class SetPlaylistTemplateDefaultRequest
    {
        public SetTemplateDefaultDto Dto { get; set; } = null!;
    }
}
