using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<Result<User>> FindOrCreateUserAsync(string googleId, string name, string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
            {
                // Business rule: Create user using domain logic
                var userResult = User.Create(googleId, name, email);
                if (userResult.IsFailed)
                {
                    return Result.Fail(userResult.Errors);
                }

                user = userResult.Value;
                await _userRepository.AddAsync(user);
                await _userRepository.SaveChangesAsync();
            }
            else
            {
                // For existing users, reload with choir relationships for proper JWT role determination
                var userWithChoirs = await _userRepository.GetByIdWithChoirsAsync(user.UserId);
                if (userWithChoirs == null)
                {
                    return Result.Fail($"User with ID {user.UserId} not found when reloading with choirs.");
                }
                user = userWithChoirs;
            }

            return Result.Ok(user);
        }

        public async Task<Result> UpdateUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail($"User with ID {userId} not found.");
            }

            // Business rule: Apply role changes using domain logic
            switch (newRole)
            {
                case UserRole.ChoirAdmin:
                    user.PromoteToAdmin();
                    break;
                case UserRole.GeneralUser:
                    user.DemoteToGeneral();
                    break;
            }

            await _userRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<User>> GetUserByEmailAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }
            return Result.Ok(user);
        }

        public async Task<Result<User>> GetUserByIdAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdWithChoirsAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }
            return Result.Ok(user);
        }

        public async Task<Result> CompleteOnboardingAsync(Guid userId, string userType)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Result.Fail($"User with ID {userId} not found.");
            }

            // Business rule: Complete onboarding using domain logic
            user.CompleteOnboarding();

            // Business rule: Set initial role based on user type
            if (userType == "admin")
            {
                user.PromoteToAdmin();
            }

            await _userRepository.SaveChangesAsync();
            return Result.Ok();
        }
    }
}
