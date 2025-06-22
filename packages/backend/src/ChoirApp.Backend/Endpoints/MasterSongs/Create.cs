using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpPost("/master-songs")]
public class Create : Endpoint<CreateMasterSongDto, MasterSongDto>
{
    private readonly IMasterSongService _songService;

    public Create(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(CreateMasterSongDto req, CancellationToken ct)
    {
        var result = await _songService.CreateMasterSongAsync(req);

        if (result.IsSuccess)
        {
            await SendCreatedAtAsync<GetAll>(new { id = result.Value.SongId }, result.Value, cancellation: ct);
        }
        else
        {
            AddError(result.Errors.First().Message);
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
