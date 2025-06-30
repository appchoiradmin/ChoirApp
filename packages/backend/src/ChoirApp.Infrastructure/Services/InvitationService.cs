using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class InvitationService : IInvitationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IInvitationPolicy _invitationPolicy;

        public InvitationService(ApplicationDbContext context, IInvitationPolicy invitationPolicy)
        {
            _context = context;
            _invitationPolicy = invitationPolicy;
        }

        public async Task<Result> CreateInvitationAsync(InviteUserDto inviteDto, Guid inviterId)
        {
            var choir = await _context.Choirs.FindAsync(inviteDto.ChoirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != inviterId)
            {
                return Result.Fail("Only the choir admin can send invitations.");
            }

            if (!await _invitationPolicy.CanBeCreated(inviteDto.ChoirId, inviteDto.Email))
            {
                return Result.Fail("An invitation has already been sent to this email address.");
            }

            var invitationResult = ChoirInvitation.Create(inviteDto.ChoirId, inviteDto.Email);
            if (invitationResult.IsFailed)
            {
                return Result.Fail(invitationResult.Errors);
            }

            _context.ChoirInvitations.Add(invitationResult.Value);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> AcceptInvitationAsync(AcceptInvitationDto acceptInvitationDto, Guid userId)
        {
            var invitation = await _context.ChoirInvitations
                .FirstOrDefaultAsync(i => i.InvitationToken == acceptInvitationDto.InvitationToken && i.Status == InvitationStatus.Pending);

            if (invitation == null)
            {
                return Result.Fail("Invalid or expired invitation token.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            if (user.Email != invitation.Email)
            {
                return Result.Fail("This invitation is not for you.");
            }

            var choir = await _context.Choirs
                .Include(c => c.UserChoirs)
                .FirstOrDefaultAsync(c => c.ChoirId == invitation.ChoirId);

            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            var addMemberResult = choir.AddMember(user);

            invitation.Accept();

            if (addMemberResult.IsFailed)
            {
                await _context.SaveChangesAsync();
                return addMemberResult;
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> RejectInvitationAsync(RejectInvitationDto rejectInvitationDto, Guid userId)
        {
            var invitation = await _context.ChoirInvitations
                .FirstOrDefaultAsync(i => i.InvitationToken == rejectInvitationDto.InvitationToken && i.Status == InvitationStatus.Pending);

            if (invitation == null)
            {
                return Result.Fail("Invalid or expired invitation token.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            if (user.Email != invitation.Email)
            {
                return Result.Fail("This invitation is not for you.");
            }

            invitation.Reject();

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<List<InvitationDto>> GetInvitationsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return new List<InvitationDto>();
            }

            var invitations = await _context.ChoirInvitations
                .Where(i => i.Email == user.Email && i.Status == InvitationStatus.Pending)
                .Include(i => i.Choir)
                .Select(i => new InvitationDto
                {
                    InvitationToken = i.InvitationToken,
                    ChoirId = i.ChoirId,
                    ChoirName = i.Choir.ChoirName,
                    Email = i.Email,
                    Status = i.Status.ToString(),
                    SentAt = i.DateSent
                })
                .ToListAsync();

            return invitations;
        }

        public async Task<List<InvitationDto>> GetInvitationsByChoirAsync(Guid choirId)
        {
            var invitations = await _context.ChoirInvitations
                .Where(i => i.ChoirId == choirId)
                .Include(i => i.Choir)
                .Select(i => new InvitationDto
                {
                    InvitationToken = i.InvitationToken,
                    ChoirId = i.ChoirId,
                    ChoirName = i.Choir.ChoirName,
                    Email = i.Email,
                    Status = i.Status.ToString(),
                    SentAt = i.DateSent
                })
                .ToListAsync();

            return invitations;
        }
    }
}
