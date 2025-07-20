using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Repositories
{
    public class ChoirRepository : IChoirRepository
    {
        private readonly ApplicationDbContext _context;

        public ChoirRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Choir?> GetByIdAsync(Guid choirId)
        {
            return await _context.Choirs.FindAsync(choirId);
        }

        public async Task<Choir?> GetByIdWithMembersAsync(Guid choirId)
        {
            return await _context.Choirs
                .Include(c => c.UserChoirs)
                .ThenInclude(uc => uc.User)
                .FirstOrDefaultAsync(c => c.ChoirId == choirId);
        }

        public async Task<bool> ExistsByNameAsync(string choirName)
        {
            return await _context.Choirs.AnyAsync(c => c.ChoirName == choirName);
        }

        public async Task<List<Choir>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Choirs
                .Where(c => c.UserChoirs.Any(uc => uc.UserId == userId))
                .ToListAsync();
        }

        public async Task<Choir?> GetByNameAsync(string choirName)
        {
            return await _context.Choirs
                .FirstOrDefaultAsync(c => c.ChoirName == choirName);
        }

        public async Task<UserChoir?> GetUserChoirAsync(Guid userId, Guid choirId)
        {
            return await _context.UserChoirs
                .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.ChoirId == choirId);
        }

        public Task<Choir> AddAsync(Choir choir)
        {
            _context.Choirs.Add(choir);
            return Task.FromResult(choir);
        }

        public Task UpdateAsync(Choir choir)
        {
            _context.Choirs.Update(choir);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Choir choir)
        {
            _context.Choirs.Remove(choir);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
