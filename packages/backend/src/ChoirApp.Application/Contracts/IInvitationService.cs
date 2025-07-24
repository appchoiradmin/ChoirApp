using ChoirApp.Application.Dtos;
using FluentResults;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IInvitationService
    {
        Task<Result> CreateInvitationAsync(InviteUserDto inviteDto, Guid inviterId);
        Task<Result<string>> CreateShareableInvitationAsync(Guid choirId, Guid inviterId);
        Task<Result> AcceptInvitationAsync(AcceptInvitationDto acceptInvitationDto, Guid userId);
        Task<Result> AcceptShareableInvitationAsync(string invitationToken, Guid userId);
        Task<Result> RejectInvitationAsync(RejectInvitationDto rejectInvitationDto, Guid userId);
        Task<List<InvitationDto>> GetInvitationsAsync(Guid userId);
        Task<List<InvitationDto>> GetInvitationsByChoirAsync(Guid choirId);
    }
}
