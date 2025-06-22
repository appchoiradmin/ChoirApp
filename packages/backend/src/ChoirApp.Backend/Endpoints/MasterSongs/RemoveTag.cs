using ChoirApp.Application.Contracts;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpDelete("/master-songs/{SongId}/tags/{TagId}")]
public class RemoveTag : Endpoint<RemoveTag.RemoveTagRequest>
{
    public class RemoveTagRequest
    {
        public Guid SongId { get; set; }
        public Guid TagId { get; set; }
    }

    private readonly IMasterSongService _songService;

    public RemoveTag(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(RemoveTagRequest req, CancellationToken ct)
    {
        var result = await _songService.RemoveTagFromSongAsync(req.SongId, req.TagId);

        if (result.IsSuccess)
        {
            await SendNoContentAsync(ct);
        }
        else
        {
            AddError(result.Errors.First().Message);
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
