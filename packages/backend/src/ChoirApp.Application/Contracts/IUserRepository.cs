using ChoirApp.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid userId);
        Task<User?> GetByIdWithChoirsAsync(Guid userId);
        Task<User?> GetByEmailAsync(string email);
        Task<User> AddAsync(User user);
        Task UpdateAsync(User user);
        Task SaveChangesAsync();
    }
}
