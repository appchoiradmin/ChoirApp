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
            Console.WriteLine($"🔍 Backend SearchSongsEndpoint called with: searchTerm='{req.SearchTerm}', title='{req.Title}', choirId='{req.ChoirId}', userId='{req.UserId}'");
            Console.WriteLine($"🏷️ Backend request tags: {(req.Tags == null ? "NULL" : $"[{string.Join(", ", req.Tags)}] (count: {req.Tags.Count})")}");
            
            // Use title as search term if provided, otherwise use SearchTerm
            string searchTerm = !string.IsNullOrEmpty(req.Title) ? req.Title : req.SearchTerm;
            
            // Get base results using existing method
            var result = await _songService.SearchSongsAsync(searchTerm, req.UserId, req.ChoirId);

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
                Console.WriteLine($"🏷️ Backend applying tag filter: [{string.Join(", ", req.Tags)}]");
                Console.WriteLine($"🏷️ Backend songs before tag filtering: {songs.Count}");
                
                // Debug: Show all songs and their tags
                foreach (var song in songs.Take(5)) // Limit to first 5 for readability
                {
                    var songTags = song.Tags?.Select(t => t.TagName).ToList() ?? new List<string>();
                    Console.WriteLine($"🏷️ Backend song '{song.Title}' has tags: [{string.Join(", ", songTags)}]");
                    
                    // Debug: Show detailed tag information
                    if (song.Tags != null && song.Tags.Any())
                    {
                        foreach (var tag in song.Tags)
                        {
                            Console.WriteLine($"🏷️   - Tag: '{tag.TagName}' (ID: {tag.TagId})");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"🏷️   - Song has NO TAGS in database");
                    }
                }
                
                songs = songs.Where(s => s.Tags != null && s.Tags.Any(t => req.Tags.Contains(t.TagName, StringComparer.OrdinalIgnoreCase))).ToList();
                
                Console.WriteLine($"🏷️ Backend songs after tag filtering: {songs.Count}");
                foreach (var song in songs)
                {
                    var songTags = song.Tags?.Select(t => t.TagName).ToList() ?? new List<string>();
                    Console.WriteLine($"🏷️ Backend filtered song '{song.Title}' has tags: [{string.Join(", ", songTags)}]");
                }
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
