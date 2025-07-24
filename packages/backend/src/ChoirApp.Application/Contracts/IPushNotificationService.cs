using ChoirApp.Application.Dtos;
using FluentResults;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    public interface IPushNotificationService
    {
        Task<Result> CreateSubscriptionAsync(CreatePushSubscriptionDto subscriptionDto, Guid userId);
        Task<Result> SendNotificationToUserAsync(Guid userId, PushNotificationDto notification);
        Task<Result> SendChoirInvitationNotificationAsync(Guid userId, string choirName, string inviterName);
        Task<Result> RemoveSubscriptionAsync(string endpoint);
    }
}
