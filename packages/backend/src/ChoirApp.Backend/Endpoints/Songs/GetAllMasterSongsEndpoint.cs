using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetAllMasterSongsEndpoint : EndpointWithoutRequest<IEnumerable<MasterSongDto>>
    {
        private readonly IMasterSongService _masterSongService;

        public GetAllMasterSongsEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/master-songs");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember), nameof(UserRole.GeneralUser));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var result = await _masterSongService.GetAllMasterSongsAsync();

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
