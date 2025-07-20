using ChoirApp.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IChoirRepository
    {
        Task<Choir?> GetByIdAsync(Guid choirId);
        Task<Choir?> GetByIdWithMembersAsync(Guid choirId);
        Task<bool> ExistsByNameAsync(string choirName);
        Task<List<Choir>> GetByUserIdAsync(Guid userId);
        Task<Choir?> GetByNameAsync(string choirName);
        Task<UserChoir?> GetUserChoirAsync(Guid userId, Guid choirId);
        Task<Choir> AddAsync(Choir choir);
        Task UpdateAsync(Choir choir);
        Task DeleteAsync(Choir choir);
        Task SaveChangesAsync();
    }
}
