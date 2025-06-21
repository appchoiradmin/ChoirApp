using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class InvitationPolicy : IInvitationPolicy
    {
        private readonly ApplicationDbContext _context;

        public InvitationPolicy(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CanBeCreated(Guid choirId, string email)
        {
            var existingInvitation = await _context.ChoirInvitations
                .AnyAsync(i => i.ChoirId == choirId && i.Email == email && i.Status == InvitationStatus.Pending);

            return !existingInvitation;
        }
    }
}
