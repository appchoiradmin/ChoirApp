using System;
using System.Linq;
using ChoirApp.Application.Services;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class RemoveTagFromSongEndpoint : EndpointWithoutRequest
    {
        private readonly ISongService _songService;

        public RemoveTagFromSongEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/songs/{songId}/tags/{tagId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var tagId = Route<Guid>("tagId");
            
            var result = await _songService.RemoveTagFromSongAsync(songId, tagId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendNoContentAsync(ct);
        }
    }
}
