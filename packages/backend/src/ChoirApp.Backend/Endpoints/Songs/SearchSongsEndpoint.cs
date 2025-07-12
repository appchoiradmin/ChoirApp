using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class SearchSongsEndpoint : Endpoint<SearchSongsRequest, IEnumerable<MasterSongDto>>
    {
        private readonly IMasterSongService _masterSongService;

        public SearchSongsEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/master-songs/search");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember), nameof(UserRole.GeneralUser));
        }

        public override async Task HandleAsync(SearchSongsRequest req, CancellationToken ct)
        {
            var result = await _masterSongService.SearchSongsAsync(req.Title, req.Artist, req.Tag, req.Skip, req.Take);

            if (result.IsFailed)
            {
                AddError(result.Errors[0].Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendAsync(result.Value, 200, ct);
        }
    }
}
