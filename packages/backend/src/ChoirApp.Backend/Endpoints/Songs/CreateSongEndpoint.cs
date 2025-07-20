using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Dtos;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CreateSongEndpoint : Endpoint<CreateSongRequest, SongResponse>
    {
        private readonly ISongService _songService;

        public CreateSongEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/songs");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(CreateSongRequest req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _songService.CreateSongAsync(
                req.Title,
                req.Artist,
                req.Content,
                userId,
                (Domain.Entities.SongVisibilityType)req.Visibility);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var response = SongResponse.FromDto(result.Value);
            await SendCreatedAtAsync<GetSongEndpoint>(
                new { songId = response.SongId },
                response,
                cancellation: ct);
        }
    }
}
