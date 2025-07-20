using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Repositories
{
    public class SongRepository : ISongRepository
    {
        private readonly ApplicationDbContext _context;

        public SongRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Song?> GetByIdAsync(Guid songId)
        {
            return await _context.Songs.FindAsync(songId);
        }

        public async Task<Song?> GetByIdWithTagsAsync(Guid songId)
        {
            return await _context.Songs
                .Include(s => s.Tags)
                .FirstOrDefaultAsync(s => s.SongId == songId);
        }

        public async Task<List<Song>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Songs
                .Where(s => s.CreatorId == userId)
                .ToListAsync();
        }

        public async Task<List<Song>> GetByChoirIdAsync(Guid choirId)
        {
            return await _context.Songs
                .Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                           s.Visibilities.Any(sv => sv.ChoirId == choirId))
                .ToListAsync();
        }

        public async Task<List<Song>> GetAllPublicAsync()
        {
            return await _context.Songs
                .Where(s => s.Visibility == SongVisibilityType.PublicAll)
                .ToListAsync();
        }

        public async Task<List<Song>> SearchAsync(string searchTerm, Guid? userId, Guid? choirId)
        {
            Console.WriteLine($"🔍 Backend SearchAsync called with: searchTerm='{searchTerm}', userId={userId}, choirId={choirId}");
            
            var query = _context.Songs.AsQueryable();

            // Apply search filter (case-insensitive)
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                Console.WriteLine($"🔍 Backend searching for: '{searchTermLower}' (lowercase)");
                
                query = query.Where(s => s.Title.ToLower().Contains(searchTermLower) ||
                                        (s.Artist != null && s.Artist.ToLower().Contains(searchTermLower)) ||
                                        s.Content.ToLower().Contains(searchTermLower));
                                        
                // Debug: Let's see what songs exist before filtering
                var allSongs = await _context.Songs.Select(s => new { s.Title, s.Artist, s.Visibility }).ToListAsync();
                Console.WriteLine($"🔍 Backend total songs in database: {allSongs.Count}");
                foreach (var song in allSongs.Where(s => s.Title.ToLower().Contains(searchTermLower)))
                {
                    Console.WriteLine($"🔍 Backend found matching song: '{song.Title}' by '{song.Artist}' (visibility: {song.Visibility})");
                }
            }

            // Apply visibility filters
            if (userId.HasValue && choirId.HasValue)
            {
                // User in choir context: show public + user's songs + choir-visible songs
                query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                        s.CreatorId == userId.Value ||
                                        s.Visibilities.Any(sv => sv.ChoirId == choirId.Value));
            }
            else if (userId.HasValue)
            {
                // User context: show public + user's songs
                query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                        s.CreatorId == userId.Value);
            }
            else if (choirId.HasValue)
            {
                // Choir context: show public + choir-visible songs
                query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                        s.Visibilities.Any(sv => sv.ChoirId == choirId.Value));
            }
            else
            {
                // Public context: show only public songs
                query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll);
            }

            var results = await query.ToListAsync();
            Console.WriteLine($"🔍 Backend SearchAsync returning {results.Count} songs after visibility filtering");
            foreach (var song in results)
            {
                Console.WriteLine($"🔍 Backend result: '{song.Title}' by '{song.Artist}' (visibility: {song.Visibility})");
            }
            return results;
        }

        public async Task<Song> AddAsync(Song song)
        {
            await _context.Songs.AddAsync(song);
            return song;
        }

        public Task UpdateAsync(Song song)
        {
            _context.Songs.Update(song);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Song song)
        {
            _context.Songs.Remove(song);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
