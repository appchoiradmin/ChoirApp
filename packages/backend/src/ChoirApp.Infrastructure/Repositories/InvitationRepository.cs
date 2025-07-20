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
    public class InvitationRepository : IInvitationRepository
    {
        private readonly ApplicationDbContext _context;

        public InvitationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChoirInvitation?> GetByIdAsync(Guid invitationId)
        {
            return await _context.ChoirInvitations
                .Include(ci => ci.Choir)
                .FirstOrDefaultAsync(ci => ci.InvitationId == invitationId);
        }

        public async Task<List<ChoirInvitation>> GetByUserEmailAsync(string email)
        {
            return await _context.ChoirInvitations
                .Include(ci => ci.Choir)
                .Where(ci => ci.Email == email && ci.Status == InvitationStatus.Pending)
                .ToListAsync();
        }

        public async Task<ChoirInvitation?> GetByTokenAsync(string invitationToken)
        {
            return await _context.ChoirInvitations
                .Include(ci => ci.Choir)
                .FirstOrDefaultAsync(ci => ci.InvitationToken == invitationToken);
        }

        public async Task<List<ChoirInvitation>> GetPendingByEmailAsync(string email)
        {
            return await _context.ChoirInvitations
                .Include(ci => ci.Choir)
                .Where(ci => ci.Email == email && ci.Status == InvitationStatus.Pending)
                .ToListAsync();
        }

        public async Task<List<ChoirInvitation>> GetByChoirIdAsync(Guid choirId)
        {
            return await _context.ChoirInvitations
                .Include(ci => ci.Choir)
                .Where(ci => ci.ChoirId == choirId)
                .ToListAsync();
        }

        public async Task<ChoirInvitation?> GetByChoirIdAndEmailAsync(Guid choirId, string email)
        {
            return await _context.ChoirInvitations
                .FirstOrDefaultAsync(ci => ci.ChoirId == choirId && ci.Email == email);
        }

        public Task<ChoirInvitation> AddAsync(ChoirInvitation invitation)
        {
            _context.ChoirInvitations.Add(invitation);
            return Task.FromResult(invitation);
        }

        public Task UpdateAsync(ChoirInvitation invitation)
        {
            _context.ChoirInvitations.Update(invitation);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ChoirInvitation invitation)
        {
            _context.ChoirInvitations.Remove(invitation);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
