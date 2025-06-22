using System.ComponentModel.DataAnnotations;
using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.MasterSongs;

[HttpPost("/master-songs/{SongId}/tags")]
public class AddTag : Endpoint<AddTag.AddTagRequest, MasterSongDto>
{
    public class AddTagRequest
    {
        public Guid SongId { get; set; }

        [Required]
        public string TagName { get; set; } = string.Empty;
    }

    private readonly IMasterSongService _songService;

    public AddTag(IMasterSongService songService)
    {
        _songService = songService;
    }

    public override async Task HandleAsync(AddTagRequest req, CancellationToken ct)
    {
        var result = await _songService.AddTagToSongAsync(req.SongId, req.TagName);

        if (result.IsSuccess)
        {
            await SendOkAsync(result.Value, ct);
        }
        else
        {
            AddError(result.Errors.First().Message);
            await SendErrorsAsync(cancellation: ct);
        }
    }
}
