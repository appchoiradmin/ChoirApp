using System;
using System.Linq;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class AddTagToSongEndpoint : Endpoint<AddTagToSongRequest>
    {
        private readonly ISongService _songService;

        public AddTagToSongEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("POST");
            Routes("/songs/{songId}/tags");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(AddTagToSongRequest req, CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            var result = await _songService.AddTagToSongAsync(songId, req.TagName);

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
