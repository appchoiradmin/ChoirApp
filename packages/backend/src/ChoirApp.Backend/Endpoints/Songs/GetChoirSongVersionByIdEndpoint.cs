using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetChoirSongVersionByIdEndpoint : Endpoint<GetChoirSongVersionByIdRequest, ChoirSongVersionDto>
    {
        private readonly IChoirSongService _choirSongService;

        public GetChoirSongVersionByIdEndpoint(IChoirSongService choirSongService)
        {
            _choirSongService = choirSongService;
        }

        public override void Configure()
        {
            Get("/choirs/{ChoirId}/songs/{SongId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(GetChoirSongVersionByIdRequest req, CancellationToken ct)
        {
            var result = await _choirSongService.GetChoirSongVersionByIdAsync(req.ChoirId, req.SongId);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendAsync(result.Value, 200, ct);
        }
    }
}
