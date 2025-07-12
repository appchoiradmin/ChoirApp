using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
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
            Verbs("GET");
            Routes("/master-songs/{Id}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember), nameof(UserRole.GeneralUser));
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
