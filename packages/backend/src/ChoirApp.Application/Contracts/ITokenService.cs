using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface ITokenService
    {
        string CreateToken(User user);
        Task<Result<string>> RefreshTokenAsync(Guid userId);
    }
}
