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
    public class PlaylistRepository : IPlaylistRepository
    {
        private readonly ApplicationDbContext _context;

        public PlaylistRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Playlist?> GetByIdAsync(Guid playlistId)
        {
            return await _context.Playlists.FindAsync(playlistId);
        }

        public async Task<Playlist?> GetByIdWithSectionsAsync(Guid playlistId)
        {
            return await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(ps => ps.PlaylistSongs)
                .ThenInclude(pss => pss.Song)
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);
        }

        public async Task<Playlist?> GetByIdWithFullDetailsAsync(Guid playlistId)
        {
            return await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(s => s.PlaylistSongs)
                .ThenInclude(ps => ps.Song)
                .Include(p => p.PlaylistTags)
                .ThenInclude(pt => pt.Tag)
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);
        }

        public async Task<List<Playlist>> GetByChoirIdAsync(Guid choirId)
        {
            return await _context.Playlists
                .Where(p => p.ChoirId == choirId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Playlist?> GetByChoirIdAndDateAsync(Guid choirId, DateTimeOffset date)
        {
            return await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(ps => ps.PlaylistSongs)
                .ThenInclude(pss => pss.Song)
                .FirstOrDefaultAsync(p => p.ChoirId == choirId && p.CreatedAt.Date == date.Date);
        }

        public Task<Playlist> AddAsync(Playlist playlist)
        {
            _context.Playlists.Add(playlist);
            return Task.FromResult(playlist);
        }

        public Task UpdateAsync(Playlist playlist)
        {
            _context.Playlists.Update(playlist);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Playlist playlist)
        {
            _context.Playlists.Remove(playlist);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        // Enhanced methods for song management
        public async Task<PlaylistSong?> GetPlaylistSongAsync(Guid playlistSongId)
        {
            return await _context.PlaylistSongs
                .Include(ps => ps.Song)
                .Include(ps => ps.PlaylistSection)
                .FirstOrDefaultAsync(ps => ps.PlaylistSongId == playlistSongId);
        }

        public Task AddPlaylistSongAsync(PlaylistSong playlistSong)
        {
            _context.PlaylistSongs.Add(playlistSong);
            return Task.CompletedTask;
        }

        public Task RemovePlaylistSongAsync(PlaylistSong playlistSong)
        {
            _context.PlaylistSongs.Remove(playlistSong);
            return Task.CompletedTask;
        }

        public Task UpdatePlaylistSongAsync(PlaylistSong playlistSong)
        {
            _context.PlaylistSongs.Update(playlistSong);
            return Task.CompletedTask;
        }
        
        // Atomic operations for complex updates
        public async Task RemoveAllSectionsAsync(Guid playlistId)
        {
            var playlist = await _context.Playlists
                .Include(p => p.Sections)
                .ThenInclude(s => s.PlaylistSongs)
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);
                
            if (playlist != null)
            {
                // Remove all songs from all sections first
                foreach (var section in playlist.Sections)
                {
                    _context.PlaylistSongs.RemoveRange(section.PlaylistSongs);
                }
                // Then remove all sections
                _context.PlaylistSections.RemoveRange(playlist.Sections);
            }
        }

        public Task AddSectionAsync(PlaylistSection section)
        {
            _context.PlaylistSections.Add(section);
            return Task.CompletedTask;
        }

        public Task AddSectionWithSongsAsync(PlaylistSection section, List<PlaylistSong> songs)
        {
            _context.PlaylistSections.Add(section);
            _context.PlaylistSongs.AddRange(songs);
            return Task.CompletedTask;
        }
    }
}
