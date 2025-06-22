using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Choir;

public class CreateChoirSongRequest
{
    public Guid ChoirId { get; set; }
    public CreateChoirSongVersionDto CreateChoirSongVersionDto { get; set; } = default!;
}

public class CreateChoirSongEndpoint : Endpoint<CreateChoirSongRequest, ChoirSongVersionDto>
{
    private readonly IChoirSongService _choirSongService;

    public CreateChoirSongEndpoint(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public override void Configure()
    {
        Post("/api/choirs/{choirId}/songs");
        Roles("ChoirAdmin", "SuperAdmin");
    }

    public override async Task HandleAsync(CreateChoirSongRequest req, CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            ThrowError("User not authenticated properly.");
            return;
        }

        var result = await _choirSongService.CreateChoirSongVersionAsync(req.ChoirId, userId, req.CreateChoirSongVersionDto);

        if (result.IsFailed)
        {
            ThrowError(result.Errors.First().Message);
            return;
        }

        await SendCreatedAtAsync<GetChoirSongByIdEndpoint>(
            new { choirId = req.ChoirId, songId = result.Value.ChoirSongId },
            result.Value,
            cancellation: ct);
    }
}
