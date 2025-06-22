using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Choir;

public class GetChoirSongByIdRequest
{
    public Guid ChoirId { get; set; }
    public Guid SongId { get; set; }
}

public class GetChoirSongByIdEndpoint : Endpoint<GetChoirSongByIdRequest, ChoirSongVersionDto>
{
    private readonly IChoirSongService _choirSongService;

    public GetChoirSongByIdEndpoint(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public override void Configure()
    {
        Get("/api/choirs/{choirId}/songs/{songId}");
        Roles("General", "ChoirAdmin", "SuperAdmin");
        Summary(s =>
        {
            s.Summary = "Get a specific choir song version by its ID";
            s.Description = "This endpoint retrieves the details of a single choir-specific song version.";
            s.Responses[200] = "Successfully retrieved the choir song version.";
            s.Responses[404] = "The choir song version was not found.";
        });
    }

    public override async Task HandleAsync(GetChoirSongByIdRequest req, CancellationToken ct)
    {
        var result = await _choirSongService.GetChoirSongVersionByIdAsync(req.ChoirId, req.SongId);

        if (result.IsFailed)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(result.Value, ct);
    }
}
