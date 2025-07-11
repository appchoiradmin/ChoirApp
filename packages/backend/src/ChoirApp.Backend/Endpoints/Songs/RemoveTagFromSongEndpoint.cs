using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class RemoveTagFromSongEndpoint : Endpoint<RemoveTagFromSongRequest>
    {
        private readonly IMasterSongService _masterSongService;

        public RemoveTagFromSongEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Verbs("DELETE");
            Routes("/master-songs/{SongId}/tags/{TagId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(RemoveTagFromSongRequest req, CancellationToken ct)
        {
            var result = await _masterSongService.RemoveTagFromSongAsync(req.SongId, req.TagId);

            if (result.IsFailed)
            {
                AddError(result.Errors[0].Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
    }
}
