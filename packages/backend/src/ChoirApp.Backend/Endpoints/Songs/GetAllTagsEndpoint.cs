using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.Songs;

public class GetAllTagsEndpoint : EndpointWithoutRequest<IEnumerable<TagDto>>
{
    private readonly ISongService _songService;

    public override void Configure()
    {
        Verbs("GET");
        Routes("/tags");
        AuthSchemes("Bearer");
        Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember), nameof(UserRole.GeneralUser));
    }

    public GetAllTagsEndpoint(ISongService songService)
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
