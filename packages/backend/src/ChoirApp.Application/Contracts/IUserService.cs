using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IUserService
    {
        Task<Result<User>> FindOrCreateUserAsync(string googleId, string name, string email);
        Task<Result> UpdateUserRoleAsync(Guid userId, UserRole newRole);
        Task<Result<User>> GetUserByEmailAsync(string email);
        Task<Result<User>> GetUserByIdAsync(Guid userId);
    }
}
