using ChoirApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IInvitationRepository
    {
        Task<ChoirInvitation?> GetByIdAsync(Guid invitationId);
        Task<ChoirInvitation?> GetByTokenAsync(string invitationToken);
        Task<List<ChoirInvitation>> GetByUserEmailAsync(string email);
        Task<List<ChoirInvitation>> GetPendingByEmailAsync(string email);
        Task<List<ChoirInvitation>> GetByChoirIdAsync(Guid choirId);
        Task<ChoirInvitation?> GetByChoirIdAndEmailAsync(Guid choirId, string email);
        Task<ChoirInvitation> AddAsync(ChoirInvitation invitation);
        Task UpdateAsync(ChoirInvitation invitation);
        Task DeleteAsync(ChoirInvitation invitation);
        Task SaveChangesAsync();
    }
}
