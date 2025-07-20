using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ChoirApp.Application.Contracts;
using ChoirApp.Application.Services;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetSongsByChoirEndpoint : EndpointWithoutRequest<List<SongResponse>>
    {
        private readonly ISongService _songService;
        private readonly IChoirService _choirService;

        public GetSongsByChoirEndpoint(ISongService songService, IChoirService choirService)
        {
            _songService = songService;
            _choirService = choirService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/choir/{choirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var choirId = Route<Guid>("choirId");
            
            // Verify the current user has permission to view this choir's songs
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }
            
            // Check if user is a member of the choir
            var choirResult = await _choirService.GetChoirByIdAsync(choirId);
            if (choirResult.IsFailed)
            {
                AddError("Choir not found.");
                await SendNotFoundAsync(ct);
                return;
            }
            
            var choir = choirResult.Value;
            // Check if user is admin or member of the choir
            var isAdmin = choir.AdminUserId == userId;
            var isMember = isAdmin || (choir.UserChoirs != null && choir.UserChoirs.Any(uc => uc.UserId == userId));
            
            if (!isMember)
            {
                AddError("You don't have permission to view this choir's songs.");
                await SendForbiddenAsync(ct);
                return;
            }

            var result = await _songService.GetSongsByChoirIdAsync(choirId);

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
