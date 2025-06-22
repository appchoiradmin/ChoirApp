using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.ChoirSongs;

[HttpGet("/choirs/{ChoirId}/songs/{SongId}")]
public class GetById : Endpoint<GetById.GetByIdRequest, ChoirSongVersionDto>
{
    public class GetByIdRequest
    {
        public Guid ChoirId { get; set; }
        public Guid SongId { get; set; }
    }

    private readonly IChoirSongService _choirSongService;

    public GetById(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public override async Task HandleAsync(GetByIdRequest req, CancellationToken ct)
    {
        var result = await _choirSongService.GetChoirSongVersionByIdAsync(req.ChoirId, req.SongId);

        if (result.IsSuccess)
        {
            await SendOkAsync(result.Value, ct);
        }
        else
        {
            await SendNotFoundAsync(ct);
        }
    }
}
