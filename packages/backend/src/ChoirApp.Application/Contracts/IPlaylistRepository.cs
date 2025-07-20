using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IPlaylistRepository
    {
        Task<Playlist?> GetByIdAsync(Guid playlistId);
        Task<Playlist?> GetByIdWithSectionsAsync(Guid playlistId);
        Task<Playlist?> GetByIdWithFullDetailsAsync(Guid playlistId);
        Task<List<Playlist>> GetByChoirIdAsync(Guid choirId);
        Task<Playlist?> GetByChoirIdAndDateAsync(Guid choirId, DateTimeOffset date);
        Task<Playlist> AddAsync(Playlist playlist);
        Task UpdateAsync(Playlist playlist);
        Task DeleteAsync(Playlist playlist);
        Task SaveChangesAsync();
        
        // Enhanced methods for song management
        Task<PlaylistSong?> GetPlaylistSongAsync(Guid playlistSongId);
        Task AddPlaylistSongAsync(PlaylistSong playlistSong);
        Task RemovePlaylistSongAsync(PlaylistSong playlistSong);
        Task UpdatePlaylistSongAsync(PlaylistSong playlistSong);
        
        // Atomic operations for complex updates
        Task RemoveAllSectionsAsync(Guid playlistId);
        Task AddSectionAsync(PlaylistSection section);
        Task AddSectionWithSongsAsync(PlaylistSection section, List<PlaylistSong> songs);
    }
}
