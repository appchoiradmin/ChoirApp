using System;
using System.Collections.Generic;
using System.Linq;
using ChoirApp.Application.Services;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class SearchSongsEndpoint : Endpoint<Requests.SearchSongsRequest, List<SongResponse>>
    {
        private readonly ISongService _songService;

        public SearchSongsEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/search");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(Requests.SearchSongsRequest req, CancellationToken ct)
        {
            var result = await _songService.SearchSongsAsync(req.SearchTerm, req.UserId, req.ChoirId);

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
