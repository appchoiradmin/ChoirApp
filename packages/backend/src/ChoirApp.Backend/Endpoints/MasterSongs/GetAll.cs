using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpGet("/master-songs"), AllowAnonymous]
public class GetAll : EndpointWithoutRequest<IEnumerable<MasterSongDto>>
{
    private readonly IMasterSongService _songService;

    public GetAll(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _songService.GetAllMasterSongsAsync();

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
