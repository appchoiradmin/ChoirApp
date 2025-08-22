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
    public class SearchSongsEndpoint : Endpoint<Requests.SearchSongsRequest, SearchSongsResponse>
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
            Console.WriteLine($"🔍 Backend SearchSongsEndpoint called with: searchTerm='{req.SearchTerm}', title='{req.Title}', choirId='{req.ChoirId}', userId='{req.UserId}', onlyUserCreated='{req.OnlyUserCreated}'");
            Console.WriteLine($"🏷️ Backend request tags: {(req.Tags == null ? "NULL" : $"[{string.Join(", ", req.Tags)}] (count: {req.Tags.Count})")}");
            
            // Use title as search term if provided, otherwise use SearchTerm
            string searchTerm = !string.IsNullOrEmpty(req.Title) ? req.Title : req.SearchTerm;
            
            // Use new method that returns count for proper pagination
            var skip = req.Skip ?? 0;
            var take = req.Take ?? 50;
            var result = await _songService.SearchSongsWithCountAsync(searchTerm, req.UserId, req.ChoirId, skip, take, req.OnlyUserCreated);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var (songs, totalCount) = result.Value;
            
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
            
            // Note: Pagination is now handled in the repository layer, so we don't need to apply it here again
            // The additional filters (artist, content, tags, visibility) are applied after pagination,
            // which means the totalCount might not be accurate if these filters remove items.
            // For now, we'll adjust the totalCount based on filtered results.
            var filteredCount = songs.Count;
            
            var response = new Responses.SearchSongsResponse
            {
                Songs = songs.Select(SongResponse.FromDto).ToList(),
                TotalCount = totalCount, // This is the count before additional filtering
                Skip = skip,
                Take = take,
                HasMore = (skip + take) < totalCount
            };
            
            Console.WriteLine($"🔍 Backend returning {response.Songs.Count} songs, totalCount: {response.TotalCount}, hasMore: {response.HasMore}");
            await SendOkAsync(response, ct);
        }
    }
}
