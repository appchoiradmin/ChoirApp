using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetMasterSongByIdEndpoint : Endpoint<GetMasterSongByIdRequest, MasterSongDto>
    {
        private readonly IMasterSongService _masterSongService;

        public GetMasterSongByIdEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Get("/api/mastersongs/{id}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(GetMasterSongByIdRequest req, CancellationToken ct)
        {
            var result = await _masterSongService.GetMasterSongByIdAsync(req.Id);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendAsync(result.Value, 200, ct);
        }
    }
}
