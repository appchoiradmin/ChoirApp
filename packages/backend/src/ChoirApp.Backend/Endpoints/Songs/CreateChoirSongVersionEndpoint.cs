using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CreateChoirSongVersionEndpoint : Endpoint<CreateChoirSongVersionRequest, ChoirSongVersionDto>
    {
        private readonly IChoirSongService _choirSongService;

        public CreateChoirSongVersionEndpoint(IChoirSongService choirSongService)
        {
            _choirSongService = choirSongService;
        }

        public override void Configure()
        {
            Verbs("POST");
            Routes("/choirs/{ChoirId}/songs");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "ChoirMember");
        }

        public override async Task HandleAsync(CreateChoirSongVersionRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _choirSongService.CreateChoirSongVersionAsync(req.ChoirId, userId, req.SongDto);

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
