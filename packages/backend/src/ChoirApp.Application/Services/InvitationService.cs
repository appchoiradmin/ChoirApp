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
        private readonly IPushNotificationService _pushNotificationService;

        public InvitationService(
            IChoirRepository choirRepository,
            IUserRepository userRepository,
            IInvitationRepository invitationRepository,
            IInvitationPolicy invitationPolicy,
            IPushNotificationService pushNotificationService)
        {
            _choirRepository = choirRepository;
            _userRepository = userRepository;
            _invitationRepository = invitationRepository;
            _invitationPolicy = invitationPolicy;
            _pushNotificationService = pushNotificationService;
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

            // Try to send push notification to the invited user
            await TrySendInvitationNotificationAsync(inviteDto.Email, choir.ChoirName, inviterId);

            return Result.Ok();
        }

        public async Task<Result<string>> CreateShareableInvitationAsync(Guid choirId, Guid inviterId)
        {
            var choir = await _choirRepository.GetByIdAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != inviterId)
            {
                return Result.Fail("Only the choir admin can create shareable invitations.");
            }

            // Create a shareable invitation using a special email format to identify it as shareable
            var shareableEmail = "SHAREABLE_INVITE@choirapp.local";
            
            var invitationResult = ChoirInvitation.Create(choirId, shareableEmail);
            if (invitationResult.IsFailed)
            {
                return Result.Fail(invitationResult.Errors);
            }

            await _invitationRepository.AddAsync(invitationResult.Value);
            await _invitationRepository.SaveChangesAsync();

            return Result.Ok(invitationResult.Value.InvitationToken);
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

        public async Task<Result> AcceptShareableInvitationAsync(string invitationToken, Guid userId)
        {
            var invitation = await _invitationRepository.GetByTokenAsync(invitationToken);

            if (invitation == null || invitation.Status != InvitationStatus.Pending)
            {
                return Result.Fail("Invalid or expired invitation token.");
            }

            // Check if this is a shareable invitation
            if (invitation.Email != "SHAREABLE_INVITE@choirapp.local")
            {
                return Result.Fail("This is not a shareable invitation. Please use the regular invitation acceptance process.");
            }

            // Check if invitation has expired (24 hours)
            var expirationTime = invitation.DateSent.AddHours(24);
            if (DateTimeOffset.UtcNow > expirationTime)
            {
                return Result.Fail("This invitation link has expired. Please ask the choir admin for a new link.");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            var choir = await _choirRepository.GetByIdWithMembersAsync(invitation.ChoirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Check if user is already a member
            if (choir.UserChoirs.Any(uc => uc.UserId == userId))
            {
                return Result.Fail("You are already a member of this choir.");
            }

            var addMemberResult = choir.AddMember(user);
            if (addMemberResult.IsFailed)
            {
                return addMemberResult;
            }

            // Mark invitation as accepted
            invitation.Accept();

            await _choirRepository.UpdateAsync(choir);
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

        private async Task TrySendInvitationNotificationAsync(string invitedEmail, string choirName, Guid inviterId)
        {
            try
            {
                // Find the invited user by email
                var invitedUser = await _userRepository.GetByEmailAsync(invitedEmail);
                if (invitedUser == null)
                {
                    // User doesn't exist yet, can't send push notification
                    return;
                }

                // Get the inviter's name
                var inviter = await _userRepository.GetByIdAsync(inviterId);
                var inviterName = inviter?.Name ?? "Someone";

                // Send push notification
                await _pushNotificationService.SendChoirInvitationNotificationAsync(
                    invitedUser.UserId, 
                    choirName, 
                    inviterName);
            }
            catch (Exception)
            {
                // Don't fail the invitation creation if push notification fails
                // This is a best-effort attempt
            }
        }
    }
}
