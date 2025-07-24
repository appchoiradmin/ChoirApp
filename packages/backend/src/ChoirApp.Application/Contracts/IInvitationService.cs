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
        Task<Result> AcceptInvitationAsync(AcceptInvitationDto acceptInvitationDto, Guid userId);
        Task<Result> RejectInvitationAsync(RejectInvitationDto rejectInvitationDto, Guid userId);
        Task<List<InvitationDto>> GetInvitationsAsync(Guid userId);
        Task<List<InvitationDto>> GetInvitationsByChoirAsync(Guid choirId);
        
        // Shareable invitation methods
        Task<Result<ShareableInvitationDto>> CreateShareableInvitationAsync(CreateShareableInvitationDto createDto, Guid createdBy);
        Task<Result> AcceptShareableInvitationAsync(AcceptShareableInvitationDto acceptDto, Guid userId);
        Task<Result<ShareableInvitationDto>> GetShareableInvitationByTokenAsync(string token);
        Task<List<ShareableInvitationDto>> GetShareableInvitationsByChoirAsync(Guid choirId);
        Task<Result> DeactivateShareableInvitationAsync(Guid invitationId, Guid userId);
    }
}
