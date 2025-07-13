using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Services;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetPublicSongsEndpoint : EndpointWithoutRequest<List<SongResponse>>
    {
        private readonly ISongService _songService;

        public GetPublicSongsEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/public");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var result = await _songService.GetAllPublicSongsAsync();

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var response = result.Value.Select(SongResponse.FromDto).ToList();
            await SendOkAsync(response, ct);
        }
    }
}
