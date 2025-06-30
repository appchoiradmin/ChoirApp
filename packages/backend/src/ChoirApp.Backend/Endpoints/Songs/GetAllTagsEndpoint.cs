using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.Songs;

public class GetAllTagsEndpoint : EndpointWithoutRequest<IEnumerable<TagDto>>
{
    private readonly IMasterSongService _songService;

    public override void Configure()
    {
        Verbs("GET");
        Routes("/tags");
        AuthSchemes("Bearer");
        Roles("ChoirAdmin", "SuperAdmin", "ChoirMember", "GeneralUser");
    }

    public GetAllTagsEndpoint(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _songService.GetAllTagsAsync();
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
