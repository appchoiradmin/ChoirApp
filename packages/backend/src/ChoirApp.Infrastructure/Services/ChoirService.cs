using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class ChoirService : IChoirService
    {
        private readonly ApplicationDbContext _context;
        private readonly IChoirUniquenessChecker _choirUniquenessChecker;
        private readonly IUserService _userService;

        public ChoirService(ApplicationDbContext context, IChoirUniquenessChecker choirUniquenessChecker, IUserService userService)
        {
            _context = context;
            _choirUniquenessChecker = choirUniquenessChecker;
            _userService = userService;
        }

        public async Task<Result<Choir>> CreateChoirAsync(CreateChoirDto choirDto, Guid adminId)
        {
            if (!await _choirUniquenessChecker.IsUnique(choirDto.Name))
            {
                return Result.Fail("A choir with this name already exists.");
            }

            var choirResult = Choir.Create(choirDto.Name, adminId);
            if (choirResult.IsFailed)
            {
                return Result.Fail(choirResult.Errors);
            }

            var choir = choirResult.Value;

            var admin = await _context.Users.FindAsync(adminId);
            if (admin == null)
            {
                return Result.Fail("Admin user not found.");
            }
            choir.AddMember(admin, true);

            _context.Choirs.Add(choir);
            await _context.SaveChangesAsync();

            await _userService.UpdateUserRoleAsync(adminId, UserRole.ChoirAdmin);

            return Result.Ok(choir);
        }

        public async Task<Result> RemoveMemberAsync(Guid choirId, Guid memberId, Guid adminId)
        {
            var choir = await _context.Choirs
                .Include(c => c.UserChoirs)
                .FirstOrDefaultAsync(c => c.ChoirId == choirId);

            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            var removeResult = choir.RemoveMember(memberId, adminId);

            if (removeResult.IsFailed)
            {
                return Result.Fail(removeResult.Errors);
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<Choir>> GetChoirByIdAsync(Guid choirId)
        {
            var choir = await _context.Choirs
                .Include(c => c.UserChoirs)
                .ThenInclude(uc => uc.User)
                .FirstOrDefaultAsync(c => c.ChoirId == choirId);

            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }
            return Result.Ok(choir);
        }

        public async Task<Result> UpdateChoirAsync(Guid choirId, CreateChoirDto choirDto, Guid adminId)
        {
            var choir = await _context.Choirs.FindAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can update the choir.");
            }

            if (choir.ChoirName != choirDto.Name)
            {
                if (!await _choirUniquenessChecker.IsUnique(choirDto.Name))
                {
                    return Result.Fail("A choir with this name already exists.");
                }
            }

            var updateResult = choir.UpdateName(choirDto.Name);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> DeleteChoirAsync(Guid choirId, Guid adminId)
        {
            var choir = await _context.Choirs.FindAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can delete the choir.");
            }

            _context.Choirs.Remove(choir);
            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> UpdateMemberRoleAsync(Guid choirId, Guid memberId, string role, Guid adminId)
        {
            var choir = await _context.Choirs
                .Include(c => c.UserChoirs)
                .FirstOrDefaultAsync(c => c.ChoirId == choirId);

            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            if (choir.AdminUserId != adminId)
            {
                return Result.Fail("Only the choir admin can update member roles.");
            }

            var member = choir.UserChoirs.FirstOrDefault(uc => uc.UserId == memberId);
            if (member == null)
            {
                return Result.Fail("Member not found in this choir.");
            }

            // Accept both "Admin" and "ChoirAdmin" as admin role
            var normalizedRole = role;
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                normalizedRole = "ChoirAdmin";
            }

            if (!Enum.TryParse<UserRole>(normalizedRole, true, out var userRole))
            {
                return Result.Fail("Invalid role specified.");
            }

            member.IsAdmin = userRole == UserRole.ChoirAdmin;

            // Also update the user's global role if promoted/demoted
            var user = await _context.Users.FindAsync(member.UserId);
            if (user != null)
            {
                if (userRole == UserRole.ChoirAdmin)
                {
                    user.PromoteToAdmin();
                }
                else if (userRole == UserRole.General)
                {
                    user.DemoteToGeneral();
                }
                await _context.SaveChangesAsync();
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }
    }
}
