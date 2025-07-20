using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using FluentResults;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Application.Services
{
    public class InvitationService : IInvitationService
    {
        private readonly IChoirRepository _choirRepository;
        private readonly IUserRepository _userRepository;
        private readonly IInvitationRepository _invitationRepository;
        private readonly IInvitationPolicy _invitationPolicy;

        public InvitationService(
            IChoirRepository choirRepository,
            IUserRepository userRepository,
            IInvitationRepository invitationRepository,
            IInvitationPolicy invitationPolicy)
        {
            _choirRepository = choirRepository;
            _userRepository = userRepository;
            _invitationRepository = invitationRepository;
            _invitationPolicy = invitationPolicy;
        }

        public async Task<Result> CreateInvitationAsync(InviteUserDto inviteDto, Guid inviterId)
        {
            var choir = await _choirRepository.GetByIdAsync(inviteDto.ChoirId);
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

            await _invitationRepository.AddAsync(invitationResult.Value);
            await _invitationRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> AcceptInvitationAsync(AcceptInvitationDto acceptInvitationDto, Guid userId)
        {
            var invitation = await _invitationRepository.GetByTokenAsync(acceptInvitationDto.InvitationToken);

            if (invitation == null || invitation.Status != InvitationStatus.Pending)
            {
                return Result.Fail("Invalid or expired invitation token.");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            if (user.Email != invitation.Email)
            {
                return Result.Fail("This invitation is not for you.");
            }

            var choir = await _choirRepository.GetByIdWithMembersAsync(invitation.ChoirId);

            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            var addMemberResult = choir.AddMember(user);

            invitation.Accept();

            if (addMemberResult.IsFailed)
            {
                await _invitationRepository.SaveChangesAsync();
                return addMemberResult;
            }

            await _choirRepository.UpdateAsync(choir);
            await _invitationRepository.UpdateAsync(invitation);
            await _invitationRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> RejectInvitationAsync(RejectInvitationDto rejectInvitationDto, Guid userId)
        {
            var invitation = await _invitationRepository.GetByTokenAsync(rejectInvitationDto.InvitationToken);

            if (invitation == null || invitation.Status != InvitationStatus.Pending)
            {
                return Result.Fail("Invalid or expired invitation token.");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            if (user.Email != invitation.Email)
            {
                return Result.Fail("This invitation is not for you.");
            }

            invitation.Reject();

            await _invitationRepository.UpdateAsync(invitation);
            await _invitationRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<List<InvitationDto>> GetInvitationsAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return new List<InvitationDto>();
            }

            var invitations = await _invitationRepository.GetPendingByEmailAsync(user.Email);

            return invitations.Select(i => new InvitationDto
            {
                InvitationToken = i.InvitationToken,
                ChoirId = i.ChoirId,
                ChoirName = i.Choir?.ChoirName ?? "Unknown Choir",
                Email = i.Email,
                Status = i.Status.ToString(),
                SentAt = i.DateSent
            }).ToList();
        }

        public async Task<List<InvitationDto>> GetInvitationsByChoirAsync(Guid choirId)
        {
            var invitations = await _invitationRepository.GetByChoirIdAsync(choirId);

            return invitations.Select(i => new InvitationDto
            {
                InvitationToken = i.InvitationToken,
                ChoirId = i.ChoirId,
                ChoirName = i.Choir?.ChoirName ?? "Unknown Choir",
                Email = i.Email,
                Status = i.Status.ToString(),
                SentAt = i.DateSent
            }).ToList();
        }
    }
}
