using ChoirApp.Application.Dtos;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IInvitationService
    {
        Task<Result> CreateInvitationAsync(InviteUserDto inviteUserDto, Guid inviterId);
        Task<Result> AcceptInvitationAsync(AcceptInvitationDto acceptInvitationDto, Guid userId);
        Task<Result> RejectInvitationAsync(RejectInvitationDto rejectInvitationDto, Guid userId);
    }
}
