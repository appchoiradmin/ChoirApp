using ChoirApp.Domain.Entities;

namespace ChoirApp.Application.Contracts
{
    public interface ISongRepository
    {
        Task<Song?> GetByIdAsync(Guid songId);
        Task<Song?> GetByIdWithTagsAsync(Guid songId);
        Task<Song?> GetByIdWithChoirsAsync(Guid songId);
        Task<List<Song>> GetByUserIdAsync(Guid userId);
        Task<List<Song>> GetByChoirIdAsync(Guid choirId);
        Task<List<Song>> GetAllPublicAsync();
        Task<List<Song>> SearchAsync(string searchTerm, Guid? userId, Guid? choirId);
        Task<Song> AddAsync(Song song);
        Task UpdateAsync(Song song);
        Task DeleteAsync(Song song);
        Task<List<SongVisibility>> GetSongVisibilitiesAsync(Guid songId);
        Task AddSongVisibilityAsync(SongVisibility songVisibility);
        Task RemoveSongVisibilityAsync(SongVisibility songVisibility);
        Task SaveChangesAsync();
    }
}
