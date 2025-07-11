using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetChoirSongVersionsEndpoint : Endpoint<GetChoirSongVersionsRequest, IEnumerable<ChoirSongVersionDto>>
    {
        private readonly IChoirSongService _choirSongService;

        public GetChoirSongVersionsEndpoint(IChoirSongService choirSongService)
        {
            _choirSongService = choirSongService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/choirs/{ChoirId}/songs");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(GetChoirSongVersionsRequest req, CancellationToken ct)
        {
            req.ChoirId = Route<Guid>("ChoirId");
            var result = await _choirSongService.GetChoirSongVersionsAsync(req.ChoirId);

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
