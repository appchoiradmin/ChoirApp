using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetSongsByUserEndpoint : EndpointWithoutRequest<List<SongResponse>>
    {
        private readonly ISongService _songService;

        public GetSongsByUserEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/user/{userId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var userId = Route<Guid>("userId");
            
            // Verify the current user has permission to view these songs
            var currentUserIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }
            
            // Only allow users to view their own songs
            if (userId != currentUserId)
            {
                AddError("You don't have permission to view this user's songs.");
                await SendForbiddenAsync(ct);
                return;
            }

            var result = await _songService.GetSongsByUserIdAsync(userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var response = result.Value.Select(SongResponse.FromDto).ToList();
            await SendOkAsync(response, ct);
        }
    }
}
