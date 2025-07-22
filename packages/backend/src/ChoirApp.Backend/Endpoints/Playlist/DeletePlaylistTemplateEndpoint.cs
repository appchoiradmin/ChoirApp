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
    public class DeletePlaylistTemplateEndpoint : Endpoint<DeletePlaylistTemplateRequest, EmptyResponse>
    {
        private readonly IPlaylistService _playlistService;

        public DeletePlaylistTemplateEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/playlist-templates/{Id}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(DeletePlaylistTemplateRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.DeletePlaylistTemplateAsync(req.Id, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }

    public class DeletePlaylistTemplateRequest
    {
        public Guid Id { get; set; }
    }
}
