using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpGet("/master-songs/{id}"), AllowAnonymous]
public class GetById : Endpoint<GetById.GetByIdRequest, MasterSongDto>
{
    public class GetByIdRequest
    {
        public Guid Id { get; set; }
    }

    private readonly IMasterSongService _songService;

    public GetById(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(GetByIdRequest req, CancellationToken ct)
    {
        var result = await _songService.GetMasterSongByIdAsync(req.Id);

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
