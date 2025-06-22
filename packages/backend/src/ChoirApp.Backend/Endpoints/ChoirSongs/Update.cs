using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace ChoirApp.Backend.Endpoints.ChoirSongs;

public class Update : Endpoint<Update.UpdateRequest, ChoirSongVersionDto>
{
    private readonly IChoirSongService _choirSongService = default!;

    public Update(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public class UpdateRequest
    {
        public Guid ChoirId { get; set; }
        public Guid SongId { get; set; }
        public UpdateChoirSongVersionDto Dto { get; set; } = default!;
    }

    public override void Configure()
    {
        Put("/choirs/{ChoirId}/songs/{SongId}");
        Description(b => b
            .Accepts<UpdateChoirSongVersionDto>("application/json")
            .Produces<ChoirSongVersionDto>(200, "application/json")
            .Produces(404));
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
    }

    public override async Task HandleAsync(UpdateRequest req, CancellationToken ct)
    {
        var result = await _choirSongService.UpdateChoirSongVersionAsync(req.ChoirId, req.SongId, req.Dto);

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
