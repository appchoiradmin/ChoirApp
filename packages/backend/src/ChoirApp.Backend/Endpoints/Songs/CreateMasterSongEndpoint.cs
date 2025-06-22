using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CreateMasterSongEndpoint : Endpoint<CreateMasterSongRequest, MasterSongDto>
    {
        private readonly IMasterSongService _masterSongService;

        public CreateMasterSongEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Post("/api/mastersongs");
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(CreateMasterSongRequest req, CancellationToken ct)
        {
            var result = await _masterSongService.CreateMasterSongAsync(req.SongDto);

            if (result.IsFailed)
            {
                AddError(result.Errors[0].Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendAsync(result.Value, 201, ct);
        }
    }
}
