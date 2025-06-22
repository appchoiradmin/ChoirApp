using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Choir;

public class GetChoirSongsRequest
{
    public Guid ChoirId { get; set; }
}

public class GetChoirSongsEndpoint : Endpoint<GetChoirSongsRequest, IEnumerable<ChoirSongVersionDto>>
{
    private readonly IChoirSongService _choirSongService;

    public GetChoirSongsEndpoint(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public override void Configure()
    {
        Get("/api/choirs/{choirId}/songs");
        Roles("General", "ChoirAdmin", "SuperAdmin");
    }

    public override async Task HandleAsync(GetChoirSongsRequest req, CancellationToken ct)
    {
        var result = await _choirSongService.GetChoirSongVersionsAsync(req.ChoirId);

        if (result.IsFailed)
        {
            ThrowError(result.Errors.First().Message);
            return;
        }

        await SendOkAsync(result.Value, ct);
    }
}
