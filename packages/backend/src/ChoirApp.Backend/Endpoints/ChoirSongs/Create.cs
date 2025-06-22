using System.Security.Claims;
using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.ChoirSongs;

[HttpPost("/choirs/{ChoirId}/songs")]
public class Create : Endpoint<Create.CreateChoirSongRequest, ChoirSongVersionDto>
{
    public class CreateChoirSongRequest
    {
        public Guid ChoirId { get; set; }
        public Guid MasterSongId { get; set; }
        public string EditedLyricsChordPro { get; set; } = string.Empty;
    }

    private readonly IChoirSongService _choirSongService;

    public Create(IChoirSongService choirSongService)
    {
        _choirSongService = choirSongService;
    }

    public override async Task HandleAsync(CreateChoirSongRequest req, CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var dto = new CreateChoirSongVersionDto
        {
            MasterSongId = req.MasterSongId,
            EditedLyricsChordPro = req.EditedLyricsChordPro
        };

        var result = await _choirSongService.CreateChoirSongVersionAsync(req.ChoirId, userId, dto);

        if (result.IsSuccess)
        {
            await SendAsync(result.Value, StatusCodes.Status201Created, ct);
        }
        else
        {
            AddError(result.Errors.First().Message);
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
