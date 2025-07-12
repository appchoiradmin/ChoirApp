using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace ChoirApp.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<User>> FindOrCreateUserAsync(string googleId, string name, string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

            if (user == null)
            {
                var userResult = User.Create(googleId, name, email);
                if (userResult.IsFailed)
                {
                    return Result.Fail(userResult.Errors);
                }

                user = userResult.Value;
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            return Result.Ok(user);
        }

        public async Task<Result> UpdateUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result.Fail($"User with ID {userId} not found.");
            }

            switch (newRole)
            {
                case UserRole.ChoirAdmin:
                    user.PromoteToAdmin();
                    break;
                case UserRole.GeneralUser:
                    user.DemoteToGeneral();
                    break;
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<User>> GetUserByEmailAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }
            return Result.Ok(user);
        }

        public async Task<Result<User>> GetUserByIdAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.UserChoirs)
                    .ThenInclude(uc => uc.Choir)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return Result.Fail("User not found.");
            }
            return Result.Ok(user);
        }

        public async Task<Result> CompleteOnboardingAsync(Guid userId, string userType)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Result.Fail($"User with ID {userId} not found.");
            }

            user.CompleteOnboarding();

            if (userType == "admin")
            {
                user.PromoteToAdmin();
            }

            await _context.SaveChangesAsync();
            return Result.Ok();
        }
    }
}
