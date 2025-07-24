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
    public class ShareableInvitationRepository : IShareableInvitationRepository
    {
        private readonly ApplicationDbContext _context;

        public ShareableInvitationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ShareableChoirInvitation?> GetByIdAsync(Guid invitationId)
        {
            return await _context.ShareableChoirInvitations
                .Include(i => i.Choir)
                .Include(i => i.Creator)
                .FirstOrDefaultAsync(i => i.InvitationId == invitationId);
        }

        public async Task<ShareableChoirInvitation?> GetByTokenAsync(string token)
        {
            return await _context.ShareableChoirInvitations
                .Include(i => i.Choir)
                .Include(i => i.Creator)
                .FirstOrDefaultAsync(i => i.InvitationToken == token);
        }

        public async Task<List<ShareableChoirInvitation>> GetByChoirIdAsync(Guid choirId)
        {
            return await _context.ShareableChoirInvitations
                .Include(i => i.Choir)
                .Include(i => i.Creator)
                .Where(i => i.ChoirId == choirId)
                .OrderByDescending(i => i.DateCreated)
                .ToListAsync();
        }

        public async Task<List<ShareableChoirInvitation>> GetActiveByChoirIdAsync(Guid choirId)
        {
            return await _context.ShareableChoirInvitations
                .Include(i => i.Choir)
                .Include(i => i.Creator)
                .Where(i => i.ChoirId == choirId && i.IsActive)
                .OrderByDescending(i => i.DateCreated)
                .ToListAsync();
        }

        public async Task AddAsync(ShareableChoirInvitation invitation)
        {
            await _context.ShareableChoirInvitations.AddAsync(invitation);
        }

        public Task UpdateAsync(ShareableChoirInvitation invitation)
        {
            _context.ShareableChoirInvitations.Update(invitation);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ShareableChoirInvitation invitation)
        {
            _context.ShareableChoirInvitations.Remove(invitation);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
