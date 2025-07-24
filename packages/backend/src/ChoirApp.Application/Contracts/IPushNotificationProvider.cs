using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using System.Threading.Tasks;

namespace ChoirApp.Application.Contracts
{
    /// <summary>
    /// Infrastructure provider for sending push notifications.
    /// Implementation will be in Infrastructure layer with external dependencies.
    /// </summary>
    public interface IPushNotificationProvider
    {
        Task<Result> SendNotificationAsync(ChoirApp.Domain.Entities.PushSubscription subscription, PushNotificationDto notification);
        Task<bool> IsConfiguredAsync();
    }
}
