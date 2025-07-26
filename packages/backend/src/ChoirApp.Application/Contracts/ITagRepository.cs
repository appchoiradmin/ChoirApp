using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface ITagRepository
    {
        Task<Tag?> GetByIdAsync(Guid tagId);
        Task<Tag?> GetByNameAsync(string tagName);
        Task<List<Tag>> GetAllAsync();
        Task<Tag> AddAsync(Tag tag);
        Task UpdateAsync(Tag tag);
        Task DeleteAsync(Tag tag);
        Task SaveChangesAsync();
        Task<SongTag?> GetSongTagAsync(Guid songId, Guid tagId);
        Task<List<SongTag>> GetSongTagsAsync(Guid songId);
        Task AddSongTagAsync(SongTag songTag);
        Task RemoveSongTagAsync(SongTag songTag);
        Task<List<Tag>> SearchTagsAsync(string query, int maxResults = 10);
    }
}
