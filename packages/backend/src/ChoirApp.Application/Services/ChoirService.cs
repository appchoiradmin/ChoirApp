using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using FluentResults;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Application.Services
{
    public class ChoirService : IChoirService
    {
        private readonly IChoirRepository _choirRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChoirUniquenessChecker _choirUniquenessChecker;
        private readonly IUserService _userService;

        public ChoirService(
            IChoirRepository choirRepository,
            IUserRepository userRepository,
            IChoirUniquenessChecker choirUniquenessChecker,
            IUserService userService)
        {
            _choirRepository = choirRepository;
            _userRepository = userRepository;
            _choirUniquenessChecker = choirUniquenessChecker;
            _userService = userService;
        }

        public async Task<Result<Choir>> CreateChoirAsync(CreateChoirDto choirDto, Guid adminId)
        {
            // Business rule: Choir names must be unique
            if (!await _choirUniquenessChecker.IsUnique(choirDto.Name))
            {
                return Result.Fail("A choir with this name already exists.");
            }

            // Create choir using domain logic
            var choirResult = Choir.Create(choirDto.Name, adminId);
            if (choirResult.IsFailed)
            {
                return Result.Fail(choirResult.Errors);
            }

            var choir = choirResult.Value;

            // Business rule: Admin must exist
            var admin = await _userRepository.GetByIdAsync(adminId);
            if (admin == null)
            {
                return Result.Fail("Admin user not found.");
            }

            // Business rule: Add admin as first member
            choir.AddMember(admin, true);

            // Persist the choir
            await _choirRepository.AddAsync(choir);
            await _choirRepository.SaveChangesAsync();

            // Business rule: Update user role to ChoirAdmin
            await _userService.UpdateUserRoleAsync(adminId, UserRole.ChoirAdmin);

            return Result.Ok(choir);
        }

        public async Task<Result> RemoveMemberAsync(Guid choirId, Guid memberId, Guid adminId)
        {
            var choir = await _choirRepository.GetByIdWithMembersAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Business rule: Only admin can remove members (enforced in domain)
            var removeResult = choir.RemoveMember(memberId, adminId);
            if (removeResult.IsFailed)
            {
                return Result.Fail(removeResult.Errors);
            }

            await _choirRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<Choir>> GetChoirByIdAsync(Guid choirId)
        {
            var choir = await _choirRepository.GetByIdWithMembersAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }
            
            return Result.Ok(choir);
        }

        public async Task<Result> UpdateChoirAsync(Guid choirId, CreateChoirDto choirDto, Guid adminId)
        {
            var choir = await _choirRepository.GetByIdAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Business rule: Only admin can update choir
            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can update the choir.");
            }

            // Business rule: New name must be unique (if changed)
            if (choir.ChoirName != choirDto.Name)
            {
                if (!await _choirUniquenessChecker.IsUnique(choirDto.Name))
                {
                    return Result.Fail("A choir with this name already exists.");
                }
            }

            // Update using domain logic
            var updateResult = choir.UpdateName(choirDto.Name);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _choirRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeleteChoirAsync(Guid choirId, Guid adminId)
        {
            var choir = await _choirRepository.GetByIdAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Business rule: Only admin can delete choir
            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can delete the choir.");
            }

            await _choirRepository.DeleteAsync(choir);
            await _choirRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> UpdateMemberRoleAsync(Guid choirId, Guid memberId, string role, Guid adminId)
        {
            var choir = await _choirRepository.GetByIdWithMembersAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Business rule: Only admin can update member roles
            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can update member roles.");
            }

            // Business rule: Valid role required
            if (!Enum.TryParse<UserRole>(role, true, out var userRole))
            {
                return Result.Fail("Invalid role specified.");
            }

            // Business rule: Member must exist in choir
            var member = choir.UserChoirs.FirstOrDefault(uc => uc.UserId == memberId);
            if (member == null)
            {
                return Result.Fail("Member not found in this choir.");
            }

            // Update member role in choir
            member.IsAdmin = userRole == UserRole.ChoirAdmin;
            
            // Update user's global role
            var user = await _userRepository.GetByIdAsync(member.UserId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            // Business rule: Apply role changes using domain logic
            if (userRole == UserRole.ChoirAdmin)
            {
                user.PromoteToAdmin();
            }
            else if (userRole == UserRole.ChoirMember)
            {
                user.DemoteToMember();
            }
            else
            {
                return Result.Fail("Invalid role for a choir member.");
            }

            await _choirRepository.SaveChangesAsync();
            return Result.Ok();
        }
    }
}
