using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Services;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetSongEndpoint : EndpointWithoutRequest<SongResponse>
    {
        private readonly ISongService _songService;

        public GetSongEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/{songId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var songId = Route<Guid>("songId");
            
            var result = await _songService.GetSongByIdAsync(songId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendNotFoundAsync(ct);
                return;
            }

            var response = SongResponse.FromDto(result.Value);
            await SendOkAsync(response, ct);
        }
    }
}
