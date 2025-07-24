using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IShareableInvitationRepository
    {
        Task<ShareableChoirInvitation?> GetByIdAsync(Guid invitationId);
        Task<ShareableChoirInvitation?> GetByTokenAsync(string token);
        Task<List<ShareableChoirInvitation>> GetByChoirIdAsync(Guid choirId);
        Task<List<ShareableChoirInvitation>> GetActiveByChoirIdAsync(Guid choirId);
        Task AddAsync(ShareableChoirInvitation invitation);
        Task UpdateAsync(ShareableChoirInvitation invitation);
        Task DeleteAsync(ShareableChoirInvitation invitation);
        Task SaveChangesAsync();
    }
}
