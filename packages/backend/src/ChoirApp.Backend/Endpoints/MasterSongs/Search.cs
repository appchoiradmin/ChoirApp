using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpGet("/songs/search"), AllowAnonymous]
public class Search : Endpoint<Search.SearchRequest, IEnumerable<MasterSongDto>>
{
    public class SearchRequest
    {
        public string? Title { get; set; }
        public string? Artist { get; set; }
        public string? Tag { get; set; }
    }

    private readonly IMasterSongService _songService;

    public Search(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(SearchRequest req, CancellationToken ct)
    {
        var result = await _songService.SearchSongsAsync(req.Title, req.Artist, req.Tag);

        if (result.IsSuccess)
        {
            await SendOkAsync(result.Value, ct);
        }
        else
        {
            // This should ideally not happen for a search, but handle it gracefully.
            await SendOkAsync(Enumerable.Empty<MasterSongDto>(), ct);
        }
    }
}
