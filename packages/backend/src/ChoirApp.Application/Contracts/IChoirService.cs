using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IChoirService
    {
        Task<Result<Choir>> CreateChoirAsync(CreateChoirDto choirDto, Guid adminId);
        Task<Result> RemoveMemberAsync(Guid choirId, Guid memberId, Guid adminId);
        Task<Result<Choir>> GetChoirByIdAsync(Guid choirId);
        Task<Result> UpdateChoirAsync(Guid choirId, UpdateChoirDto choirDto, Guid adminId);
        Task<Result> DeleteChoirAsync(Guid choirId, Guid adminId);
        Task<Result> UpdateMemberRoleAsync(Guid choirId, Guid memberId, string role, Guid adminId);
    }
}
