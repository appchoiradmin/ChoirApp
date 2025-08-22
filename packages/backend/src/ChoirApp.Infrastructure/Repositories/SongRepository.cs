using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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
                    .ThenInclude(st => st.Tag)
                .FirstOrDefaultAsync(s => s.SongId == songId);
        }

        public async Task<Song?> GetByIdWithChoirsAsync(Guid songId)
        {
            return await _context.Songs
                .Include(s => s.Tags)
                    .ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities)
                    .ThenInclude(sv => sv.Choir)
                .FirstOrDefaultAsync(s => s.SongId == songId);
        }

        public async Task<List<Song>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Songs
                .Include(s => s.Visibilities)
                .Include(s => s.Tags)
                .Where(s => s.CreatorId == userId)
                .ToListAsync();
        }

        public async Task<List<Song>> GetByChoirIdAsync(Guid choirId)
        {   
            var publicSongs = await _context.Songs
                .Include(s => s.Visibilities)
                .Include(s => s.Tags)
                .Where(s => s.Visibility == SongVisibilityType.PublicAll)
                .ToListAsync();
            
            var publicChoirsSongs = await _context.Songs
                .Include(s => s.Visibilities)
                .Include(s => s.Tags)
                .Where(s => s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId))
                .ToListAsync();
            
            var results = await _context.Songs
                .Include(s => s.Visibilities)
                .Include(s => s.Tags)
                    .ThenInclude(st => st.Tag)  // CRITICAL: Include the actual Tag entity within SongTag
                .Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                           (s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId)))
                .ToListAsync();                
            
            return results;
        }

        public async Task<List<Song>> GetAllPublicAsync()
        {
            return await _context.Songs
                .Include(s => s.Visibilities)
                .Include(s => s.Tags)
                .Where(s => s.Visibility == SongVisibilityType.PublicAll)
                .ToListAsync();
        }

        public async Task<List<Song>> SearchAsync(string searchTerm, Guid? userId, Guid? choirId, bool? onlyUserCreated = null)
        {
            
            // CRITICAL FIX: Include navigation properties for visibility filtering
            var query = _context.Songs
                .Include(s => s.Visibilities) // Required for choir visibility filtering
                .Include(s => s.Tags)
                    .ThenInclude(st => st.Tag)  // CRITICAL: Include the actual Tag entity within SongTag
                .AsQueryable();

            // Apply search filter (case-insensitive)
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                
                query = query.Where(s => s.Title.ToLower().Contains(searchTermLower) ||
                                        (s.Artist != null && s.Artist.ToLower().Contains(searchTermLower)) ||
                                        s.Content.ToLower().Contains(searchTermLower));
            }

            
            // Apply "My Songs" filter if specifically requested
            if (onlyUserCreated.HasValue && onlyUserCreated.Value && userId.HasValue)
            {
                // Show songs where user is creator OR where user created a version
                query = query.Where(s => s.CreatorId == userId.Value ||
                                        _context.Songs.Any(version => version.BaseSongId == s.SongId && version.CreatorId == userId.Value));
            }
            else
            {
                // Apply normal visibility filters (when onlyUserCreated is false/null or conditions not met)
                
                if (userId.HasValue && choirId.HasValue)
                {
                    // User in choir context: show public + user's songs + choir-visible songs
                    query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                            s.CreatorId == userId.Value ||
                                            (s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
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
                                            (s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
                }
                else
                {
                    // Public context: show only public songs
                    query = query.Where(s => s.Visibility == SongVisibilityType.PublicAll);
                }
            }

            var results = await query.ToListAsync();
            
            
            return results;
        }

        public async Task<(List<Song> songs, int totalCount)> SearchWithCountAsync(string searchTerm, Guid? userId, Guid? choirId, int skip, int take, bool? onlyUserCreated = null)
        {
            
            // CRITICAL FIX: Include navigation properties for visibility filtering
            var baseQuery = _context.Songs
                .Include(s => s.Visibilities) // Required for choir visibility filtering
                .Include(s => s.Tags)
                    .ThenInclude(st => st.Tag)  // CRITICAL: Include the actual Tag entity within SongTag
                .AsQueryable();

            // Apply search filter (case-insensitive)
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                
                baseQuery = baseQuery.Where(s => s.Title.ToLower().Contains(searchTermLower) ||
                                        (s.Artist != null && s.Artist.ToLower().Contains(searchTermLower)) ||
                                        s.Content.ToLower().Contains(searchTermLower));
            }

            // Apply "My Songs" filter if specifically requested
            if (onlyUserCreated.HasValue && onlyUserCreated.Value && userId.HasValue)
            {
                // Show songs where user is creator OR where user created a version
                baseQuery = baseQuery.Where(s => s.CreatorId == userId.Value ||
                                        _context.Songs.Any(version => version.BaseSongId == s.SongId && version.CreatorId == userId.Value));
            }
            else
            {
                // Apply normal visibility filters (when onlyUserCreated is false/null or conditions not met)
                
                if (userId.HasValue && choirId.HasValue)
                {
                    // User in choir context: show public + user's songs + choir-visible songs
                    baseQuery = baseQuery.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                            s.CreatorId == userId.Value ||
                                            (s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
                }
                else if (userId.HasValue)
                {
                    // User context: show public + user's songs
                    baseQuery = baseQuery.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                            s.CreatorId == userId.Value);
                }
                else if (choirId.HasValue)
                {
                    // Choir context: show public + choir-visible songs
                    baseQuery = baseQuery.Where(s => s.Visibility == SongVisibilityType.PublicAll ||
                                            (s.Visibility == SongVisibilityType.PublicChoirs && s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
                }
                else
                {
                    // Public context: show only public songs
                    baseQuery = baseQuery.Where(s => s.Visibility == SongVisibilityType.PublicAll);
                }
            }

            // Get total count before pagination
            var totalCount = await baseQuery.CountAsync();

            // Apply pagination
            var paginatedResults = await baseQuery
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            
            return (paginatedResults, totalCount);
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

        public async Task<List<SongVisibility>> GetSongVisibilitiesAsync(Guid songId)
        {
            return await _context.SongVisibilities
                .Where(sv => sv.SongId == songId)
                .ToListAsync();
        }

        public async Task AddSongVisibilityAsync(SongVisibility songVisibility)
        {
            await _context.SongVisibilities.AddAsync(songVisibility);
        }

        public Task RemoveSongVisibilityAsync(SongVisibility songVisibility)
        {
            _context.SongVisibilities.Remove(songVisibility);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
