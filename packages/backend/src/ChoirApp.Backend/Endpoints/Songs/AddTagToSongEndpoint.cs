using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class AddTagToSongEndpoint : Endpoint<AddTagToSongRequest, MasterSongDto>
    {
        private readonly IMasterSongService _masterSongService;

        public AddTagToSongEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Verbs("POST");
            Routes("/master-songs/{SongId}/tags");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(AddTagToSongRequest req, CancellationToken ct)
        {
            var result = await _masterSongService.AddTagToSongAsync(req.SongId, req.TagName);

            if (result.IsFailed)
            {
                AddError(result.Errors[0].Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendAsync(result.Value, 200, ct);
        }
    }
}
