using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface ISongRepository
    {
        Task<Song?> GetByIdAsync(Guid songId);
        Task<Song?> GetByIdWithTagsAsync(Guid songId);
        Task<List<Song>> GetByUserIdAsync(Guid userId);
        Task<List<Song>> GetByChoirIdAsync(Guid choirId);
        Task<List<Song>> GetAllPublicAsync();
        Task<List<Song>> SearchAsync(string searchTerm, Guid? userId, Guid? choirId);
        Task<Song> AddAsync(Song song);
        Task UpdateAsync(Song song);
        Task DeleteAsync(Song song);
        Task SaveChangesAsync();
    }
}
