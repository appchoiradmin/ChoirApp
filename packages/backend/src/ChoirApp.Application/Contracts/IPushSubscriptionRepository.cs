using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IPushSubscriptionRepository
    {
        Task<PushSubscription?> GetByIdAsync(Guid pushSubscriptionId);
        Task<IEnumerable<PushSubscription>> GetByUserIdAsync(Guid userId);
        Task<PushSubscription?> GetByEndpointAsync(string endpoint);
        Task<IEnumerable<PushSubscription>> GetActiveByUserIdAsync(Guid userId);
        Task AddAsync(PushSubscription pushSubscription);
        Task UpdateAsync(PushSubscription pushSubscription);
        Task DeleteAsync(PushSubscription pushSubscription);
        Task SaveChangesAsync();
    }
}
