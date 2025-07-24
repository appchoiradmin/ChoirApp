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
    public class PushSubscriptionRepository : IPushSubscriptionRepository
    {
        private readonly ApplicationDbContext _context;

        public PushSubscriptionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PushSubscription?> GetByIdAsync(Guid pushSubscriptionId)
        {
            return await _context.PushSubscriptions
                .Include(ps => ps.User)
                .FirstOrDefaultAsync(ps => ps.PushSubscriptionId == pushSubscriptionId);
        }

        public async Task<IEnumerable<PushSubscription>> GetByUserIdAsync(Guid userId)
        {
            return await _context.PushSubscriptions
                .Where(ps => ps.UserId == userId)
                .ToListAsync();
        }

        public async Task<PushSubscription?> GetByEndpointAsync(string endpoint)
        {
            return await _context.PushSubscriptions
                .FirstOrDefaultAsync(ps => ps.Endpoint == endpoint);
        }

        public async Task<IEnumerable<PushSubscription>> GetActiveByUserIdAsync(Guid userId)
        {
            return await _context.PushSubscriptions
                .Where(ps => ps.UserId == userId && ps.IsActive)
                .ToListAsync();
        }

        public async Task AddAsync(PushSubscription pushSubscription)
        {
            await _context.PushSubscriptions.AddAsync(pushSubscription);
        }

        public Task UpdateAsync(PushSubscription pushSubscription)
        {
            _context.PushSubscriptions.Update(pushSubscription);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(PushSubscription pushSubscription)
        {
            _context.PushSubscriptions.Remove(pushSubscription);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
