using System;
using System.Collections.Generic;
using System.Linq;
using ChoirApp.Application.Contracts;
using ChoirApp.Backend.Endpoints.Songs.Responses;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class SearchSongsEndpoint : Endpoint<Requests.SearchSongsRequest, List<SongResponse>>
    {
        private readonly ISongService _songService;

        public SearchSongsEndpoint(ISongService songService)
        {
            _songService = songService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/songs/search");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(Requests.SearchSongsRequest req, CancellationToken ct)
        {
            // Use title as search term if provided, otherwise use SearchTerm
            string searchTerm = !string.IsNullOrEmpty(req.Title) ? req.Title : req.SearchTerm;
            
            // Get base results using existing method
            var result = await _songService.SearchSongsAsync(searchTerm, req.UserId ?? req.CreatorId, req.ChoirId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var songs = result.Value;
            
            // Apply additional filters if provided
            if (!string.IsNullOrEmpty(req.Artist))
            {
                songs = songs.Where(s => s.Artist != null && s.Artist.Contains(req.Artist, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            if (!string.IsNullOrEmpty(req.Content))
            {
                songs = songs.Where(s => s.Content.Contains(req.Content, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            if (req.Tags != null && req.Tags.Any())
            {
                songs = songs.Where(s => s.Tags != null && s.Tags.Any(t => req.Tags.Contains(t.TagName, StringComparer.OrdinalIgnoreCase))).ToList();
            }
            
            if (req.Visibility.HasValue)
            {
                songs = songs.Where(s => (int)s.Visibility == (int)req.Visibility.Value).ToList();
            }
            
            // Apply pagination if provided
            if (req.Skip.HasValue || req.Take.HasValue)
            {
                int skip = req.Skip ?? 0;
                int take = req.Take ?? 10; // Default to 10 if not specified
                
                songs = songs.Skip(skip).Take(take).ToList();
            }

            var response = songs.Select(SongResponse.FromDto).ToList();
            await SendOkAsync(response, ct);
        }
    }
}
