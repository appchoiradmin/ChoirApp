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
            var query = _context.Songs.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(s => s.Title.Contains(searchTerm) ||
                                        (s.Artist != null && s.Artist.Contains(searchTerm)) ||
                                        s.Content.Contains(searchTerm));
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

            return await query.ToListAsync();
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
