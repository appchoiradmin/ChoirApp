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
        private readonly IShareableInvitationRepository _shareableInvitationRepository;
        private readonly IInvitationPolicy _invitationPolicy;
        private readonly IPushNotificationService _pushNotificationService;

        public InvitationService(
            IChoirRepository choirRepository,
            IUserRepository userRepository,
            IInvitationRepository invitationRepository,
            IShareableInvitationRepository shareableInvitationRepository,
            IInvitationPolicy invitationPolicy,
            IPushNotificationService pushNotificationService)
        {
            _choirRepository = choirRepository;
            _userRepository = userRepository;
            _invitationRepository = invitationRepository;
            _shareableInvitationRepository = shareableInvitationRepository;
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

            // Prevent creation of fake invitation records that might be used for shareable invitations
            if (inviteDto.Email.Contains("@choirapp.local") || 
                inviteDto.Email.StartsWith("SHAREABLE_") || 
                inviteDto.Email.Contains("_INVITE@"))
            {
                return Result.Fail("Invalid email address format. Please use a valid email address.");
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

            // Filter out any fake invitation entries that might have been created for shareable invitations
            // These should never appear in the regular invitation list
            var validInvitations = invitations.Where(i => 
                !string.IsNullOrEmpty(i.Email) && 
                !i.Email.Contains("@choirapp.local") && 
                !i.Email.StartsWith("SHAREABLE_") &&
                !i.Email.Contains("_INVITE@") &&
                new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(i.Email)
            ).ToList();

            Console.WriteLine($"🔍 GetInvitationsAsync - Filtered {invitations.Count - validInvitations.Count} fake invitation entries for user {userId}");

            return validInvitations.Select(i => new InvitationDto
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

            // Filter out any fake invitation entries that might have been created for shareable invitations
            // These should never appear in the regular invitation list
            var validInvitations = invitations.Where(i => 
                !string.IsNullOrEmpty(i.Email) && 
                !i.Email.Contains("@choirapp.local") && 
                !i.Email.StartsWith("SHAREABLE_") &&
                !i.Email.Contains("_INVITE@") &&
                new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(i.Email)
            ).ToList();

            Console.WriteLine($"🔍 GetInvitationsByChoirAsync - Filtered {invitations.Count - validInvitations.Count} fake invitation entries for choir {choirId}");

            return validInvitations.Select(i => new InvitationDto
            {
                InvitationToken = i.InvitationToken,
                ChoirId = i.ChoirId,
                ChoirName = i.Choir?.ChoirName ?? "Unknown Choir",
                Email = i.Email,
                Status = i.Status.ToString(),
                SentAt = i.DateSent
            }).ToList();
        }

        // Shareable invitation methods
        public async Task<Result<ShareableInvitationDto>> CreateShareableInvitationAsync(CreateShareableInvitationDto createDto, Guid createdBy)
        {
            var choir = await _choirRepository.GetByIdAsync(createDto.ChoirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Check if the user has admin privileges for this choir
            var userChoir = await _choirRepository.GetUserChoirAsync(createdBy, createDto.ChoirId);
            if (userChoir == null || !userChoir.IsAdmin)
            {
                return Result.Fail("Only choir admins can create shareable invitations.");
            }

            // Set fixed 24-hour expiration for all shareable invitations
            var expiryDate = DateTimeOffset.UtcNow.AddHours(24);
            Console.WriteLine($"🔧 CreateShareableInvitation - Setting 24-hour expiry: {expiryDate}");

            var invitationResult = ShareableChoirInvitation.Create(createDto.ChoirId, createdBy, expiryDate, createDto.MaxUses);
            if (invitationResult.IsFailed)
            {
                return Result.Fail(invitationResult.Errors);
            }

            await _shareableInvitationRepository.AddAsync(invitationResult.Value);
            await _shareableInvitationRepository.SaveChangesAsync();

            var dto = new ShareableInvitationDto
            {
                InvitationId = invitationResult.Value.InvitationId,
                ChoirId = invitationResult.Value.ChoirId,
                InvitationToken = invitationResult.Value.InvitationToken,
                CreatedBy = invitationResult.Value.CreatedBy,
                DateCreated = invitationResult.Value.DateCreated,
                ExpiryDate = invitationResult.Value.ExpiryDate,
                IsActive = invitationResult.Value.IsActive,
                MaxUses = invitationResult.Value.MaxUses,
                CurrentUses = invitationResult.Value.CurrentUses,
                InvitationUrl = $"/invite/{invitationResult.Value.InvitationToken}"
            };

            return Result.Ok(dto);
        }

        public async Task<Result> AcceptShareableInvitationAsync(AcceptShareableInvitationDto acceptDto, Guid userId)
        {
            var invitation = await _shareableInvitationRepository.GetByTokenAsync(acceptDto.InvitationToken);
            if (invitation == null)
            {
                return Result.Fail("Invalid invitation token.");
            }

            var canBeUsedResult = invitation.CanBeUsed();
            if (canBeUsedResult.IsFailed)
            {
                return Result.Fail(canBeUsedResult.Errors);
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

            // Debug logging
            Console.WriteLine($"🔍 AcceptShareableInvitation - Checking membership for User {userId} in Choir {choir.ChoirId}");
            Console.WriteLine($"🔍 AcceptShareableInvitation - Choir has {choir.UserChoirs?.Count ?? 0} members");
            
            // Check if user is already a member - multiple approaches for safety
            var existingMembership = choir.UserChoirs?.FirstOrDefault(uc => uc.UserId == userId);
            if (existingMembership != null)
            {
                Console.WriteLine($"🟡 AcceptShareableInvitation - User {userId} is already a member of choir {choir.ChoirId}");
                return Result.Ok(); // Return success instead of error - user is already in the choir, which is the desired outcome
            }
            
            // Double-check with direct database query as additional safety
            var directMembershipCheck = await _choirRepository.GetUserChoirAsync(userId, choir.ChoirId);
            if (directMembershipCheck != null)
            {
                Console.WriteLine($"🟡 AcceptShareableInvitation - Direct DB check confirms user {userId} is already a member of choir {choir.ChoirId}");
                return Result.Ok(); // Return success instead of error
            }
            
            Console.WriteLine($"🟢 AcceptShareableInvitation - User {userId} is not a member, proceeding to add to choir {choir.ChoirId}");

            // Add user to choir
            var addMemberResult = choir.AddMember(user, false);
            if (addMemberResult.IsFailed)
            {
                return Result.Fail(addMemberResult.Errors);
            }

            // Increment invitation usage
            invitation.IncrementUse();

            try
            {
                await _choirRepository.UpdateAsync(choir);
                await _shareableInvitationRepository.UpdateAsync(invitation);
                await _shareableInvitationRepository.SaveChangesAsync();
                
                Console.WriteLine($"🟢 AcceptShareableInvitation - Successfully added user {userId} to choir {choir.ChoirId}");
                return Result.Ok();
            }
            catch (Exception ex) when (ex.Message.Contains("duplicate key value violates unique constraint \"PK_UserChoirs\"") || 
                                      (ex.InnerException?.Message?.Contains("duplicate key value violates unique constraint \"PK_UserChoirs\"") == true))
            {
                // Handle duplicate key error - user is already a member, which is the desired outcome
                Console.WriteLine($"🟡 AcceptShareableInvitation - Duplicate key error caught, user {userId} is already a member of choir {choir.ChoirId}");
                return Result.Ok(); // Return success since the user is already in the choir
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔴 AcceptShareableInvitation - Unexpected error: {ex.Message}");
                return Result.Fail($"Failed to accept invitation: {ex.Message}");
            }
        }

        public async Task<Result<ShareableInvitationDto>> GetShareableInvitationByTokenAsync(string token)
        {
            var invitation = await _shareableInvitationRepository.GetByTokenAsync(token);
            if (invitation == null)
            {
                return Result.Fail("Invitation not found.");
            }

            var dto = new ShareableInvitationDto
            {
                InvitationId = invitation.InvitationId,
                ChoirId = invitation.ChoirId,
                InvitationToken = invitation.InvitationToken,
                CreatedBy = invitation.CreatedBy,
                DateCreated = invitation.DateCreated,
                ExpiryDate = invitation.ExpiryDate,
                IsActive = invitation.IsActive,
                MaxUses = invitation.MaxUses,
                CurrentUses = invitation.CurrentUses,
                InvitationUrl = $"/invite/{invitation.InvitationToken}"
            };

            return Result.Ok(dto);
        }

        public async Task<List<ShareableInvitationDto>> GetShareableInvitationsByChoirAsync(Guid choirId)
        {
            var invitations = await _shareableInvitationRepository.GetByChoirIdAsync(choirId);

            // Filter out expired and inactive invitations to prevent them from appearing in the UI
            var activeInvitations = invitations.Where(i => 
                i.IsActive && 
                (!i.ExpiryDate.HasValue || i.ExpiryDate.Value > DateTimeOffset.UtcNow)
            );

            return activeInvitations.Select(i => new ShareableInvitationDto
            {
                InvitationId = i.InvitationId,
                ChoirId = i.ChoirId,
                InvitationToken = i.InvitationToken,
                CreatedBy = i.CreatedBy,
                DateCreated = i.DateCreated,
                ExpiryDate = i.ExpiryDate,
                IsActive = i.IsActive,
                MaxUses = i.MaxUses,
                CurrentUses = i.CurrentUses,
                InvitationUrl = $"/invite/{i.InvitationToken}"
            }).ToList();
        }

        public async Task<Result> DeactivateShareableInvitationAsync(Guid invitationId, Guid userId)
        {
            var invitation = await _shareableInvitationRepository.GetByIdAsync(invitationId);
            if (invitation == null)
            {
                return Result.Fail("Invitation not found.");
            }

            var choir = await _choirRepository.GetByIdAsync(invitation.ChoirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != userId)
            {
                return Result.Fail("Only the choir admin can deactivate invitations.");
            }

            invitation.Deactivate();
            await _shareableInvitationRepository.UpdateAsync(invitation);
            await _shareableInvitationRepository.SaveChangesAsync();

            return Result.Ok();
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
